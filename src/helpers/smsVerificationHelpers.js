const {sendCodeWithNeutrino} = require('../services/neutrinoVerifyService');
const sanitizePhone = require( '../utils/phoneSanitizer');
const sendResponse = require('../utils/sendResponse');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const VerificationCode = require('../models/verificationCode');
const blockedPhone = require('../models/blockedPhone');
const verifyCodeSchema = require('./validatorCode');
const maxTries = 5;
const blockBaseTime = 15 * 60 * 1000;

async function sendCode(phone) {
  try {
    const sanitizedPhone = sanitizePhone(phone);

    if (!sanitizedPhone) {
      return {
        ok: false,
        message: 'Número de teléfono inválido'
      };
    }

    const response = await sendCodeWithNeutrino(sanitizedPhone,'Super Kompras: tu código es {{CODE}}');
    logger.info(`[sendVerificationCode] SMS sent to: ${sanitizedPhone}`);

    if (!response['sent']) {
      logger.error(`Neutrino falló: ${response['status-message']}`);
      return {
        ok: false,
        message: 'No se pudo enviar el código',
        error: response['status-message']
      };
    }
    

    const securityCode = response['security-code'];
    const hashedCode = await bcrypt.hash(securityCode, 10);
    const expirationMinutes = 5;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);

    const saved = await VerificationCode.create({
      phone: sanitizedPhone,
      code: hashedCode,
      provider: 'Neutrino',
      status: 'pendiente',
      createdAt: now,
      expiresAt
    });

    logger.info(`Código generado ID: ${saved._id} para ${sanitizedPhone}, expira en ${expiresAt.toLocaleTimeString()}`);

    return {
      ok: true,
      message: 'Código enviado y guardado correctamente',
      phone: sanitizedPhone,
      expiresAt
    };

  } catch (error) {
    logger.error('Excepción al guardar código:', {
  mensaje: error.message,
  detalles: error.response?.data || null,
  status: error.response?.status || null
});

    return {
      ok: false,
      message: 'Error interno',
      error: error.message
    };
  }
}

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

const checkVerifyCode = async (phone, code) => {
  try {
     const parseResult = verifyCodeSchema.safeParse({ phone, code });
    

    if (!parseResult.success) {
  const zodErrors = parseResult.error?.issues || [];  

  if (zodErrors.length === 1) {
    return {
      ok: false,
      message: `Datos inválidos: ${zodErrors[0].message}`
    };
  }

  if (zodErrors.length > 1) {
    const mensajes = zodErrors.map(err => err.message).join(', ');
    return {
      ok: false,
      message: `Datos inválidos: ${mensajes}`
    };
  }

  return {
    ok: false,
    message: 'Datos inválidos: Error de validación desconocido'
  };
}


    const registros = await VerificationCode.find({
      phone,
      status: 'pendiente',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (registros.length === 0) {
      logger.warn(`Sin códigos vigentes para ${phone}`);
      return {
        ok: false,
        message: 'Código inexistente o expirado'
      };
    }

    for (const reg of registros) {
      const valido = await bcrypt.compare(code, reg.code);
      if (valido) {
        reg.status = 'verificado';
        reg.verifiedAt = new Date();
        await reg.save();

        logger.info(`Verificación correcta para ${phone}`);
        return {
          ok: true,
          message: 'Código verificado correctamente'
        };
      }
    }

    // Si ninguno coincidió
    const intento = registros[0];
    intento.filedAttempts += 1;
    await intento.save();

    logger.warn(`Código incorrecto (${intento.filedAttempts}/${maxTries}) para ${phone}`);

    if (intento.filedAttempts >= maxTries) {
      await bloquearTelefono(phone);
     return {
    ok: false,
    message: 'Número bloqueado temporalmente por demasiados intentos fallidos'
  };
}

    return {
      ok: false,
      message: 'Código incorrecto'
    };

  } catch (err) {
    logger.error('Error al verificar código: ' + err.message);
    return {
      ok: false,
      message: 'Error interno',
      error: err.message
    };
  }
};

module.exports = {
  sendCode,
  checkVerifyCode
};
