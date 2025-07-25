const {sendCodeWithNeutrino} = require('../services/neutrinoVerifyService');
const sanitizePhone = require( '../utils/phoneSanitizer');
const sendResponse = require('../utils/sendResponse');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const VerificationCode = require('../models/verificationCode');
const blockedPhone = require('../models/blockedPhone');

const maxTries = 5;
const blockBaseTime = 15 * 60 * 1000;

 async function sendCode(req, res) {
  try {
    const rawPhone = req.body.phone;
    const phone = sanitizePhone(rawPhone);

    if (!phone) {
      return sendResponse(res, 400, false, 'Número de teléfono inválido');
    }

    const response = await sendCodeWithNeutrino(phone);

       if (response['sent'] !== true) {
      logger.error(`Neutrino falló: ${response['status-message']}`);
      return sendResponse(res, 500, false, 'No se pudo enviar el código', {
        error: response['status-message']
      });
    }

    const securityCode = response['security-code'];
    const hashedCode = await bcrypt.hash(securityCode, 10);
    const expirationMinutes = 5;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);
    const saved = await VerificationCode.create({
      phone,
      code: hashedCode,
      provider: 'Neutrino',
      status: 'pendiente',
      createdAt: now,
      expiresAt: expiresAt
    });

    logger.info(`Código generado ID: ${saved._id} para ${phone}, expira en ${expiresAt.toLocaleTimeString()}`);

    return sendResponse(res, 200, true, 'Código enviado y guardado correctamente', {
      phone,
      expiresAt
    });

  } catch (error) {
    logger.error(` Excepción al guardar código: ${error.message}`);
    return sendResponse(res, 500, false, 'Error interno', {
      error: error.message
    });
  }
};

const checkVerifyCode = async (req, res) => {
    const { phone, code } = req.body;

    try {
        // Buscar códigos vigentes
        const registros = await VerificationCode.find({
            phone,
            status: 'pendiente',
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (registros.length === 0) {
            logger.warn(`Sin códigos vigentes para ${phone}`);
            return res.status(400).json({ msg: 'Código inexistente o expirado' });
        }

        // Comparar con bcrypt
        for (const reg of registros) {
            const valido = await bcrypt.compare(code, reg.code);
            if (valido) {
                reg.status = 'verificado';
                reg.verifiedAt = new Date();
                await reg.save();

                logger.info(`Verificación correcta para ${phone}`);
                return res.status(200).json({ msg: 'Código verificado correctamente' });
            }
        }

        // Si ninguno coincidió
        const intento = registros[0];
        intento.filedAttempts += 1;
        await intento.save();

        logger.warn(`Código incorrecto (${intento.filedAttempts}/${maxTries}) para ${phone}`);

        if (intento.filedAttempts >= maxTries) {
            await bloquearTelefono(phone);
        }

        return res.status(400).json({ msg: 'Código incorrecto' });

    } catch (err) {
        logger.error('Error al verificar código: ' + err.message);
        return res.status(500).json({ msg: 'Error al verificar código' });
    }
};

// ✅ Función para bloquear número
const bloquearTelefono = async (phone) => {
    const ahora = new Date();
    const doc = await blockedPhone.findOne({ phone });

    if (doc) {
        doc.recurrences += 1;
        doc.locked_at = ahora;
        doc.unlocked_at = new Date(ahora.getTime() + blockBaseTime * doc.recurrences);
        await doc.save();
        logger.warn(`Re-bloqueo ${phone} (recurrencias: ${doc.recurrences})`);
    } else {
        await blockedPhone.create({
            phone,
            locked_at: ahora,
            unlocked_at: new Date(ahora.getTime() + blockBaseTime),
            recurrences: 1
        });
        logger.warn(`Bloqueo inicial de ${phone}`);
    }
};

module.exports = {
  sendCode,
  checkVerifyCode
};
