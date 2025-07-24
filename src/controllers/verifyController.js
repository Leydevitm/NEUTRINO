const {sendCodeWithNeutrino} = require('../services/neutrinoVerifyService');
const sanitizePhone = require( '../utils/phoneSanitizer');
const sendResponse = require('../utils/sendResponse');
const logger = require('../utils/logger');
const VerificationCode = require('../models/verificationCode');
const bcrypt = require('bcrypt');

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
module.exports = {
  sendCode
};
