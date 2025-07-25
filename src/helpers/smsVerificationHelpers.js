const bcrypt = require('bcrypt');
const VerificationCode = require('../models/verificationCode');
const blockedPhone = require('../models/blockedPhone');
const logger = require('../utils/logger');

const maxTries = 5;
const blockBaseTime = 15 * 60 * 1000; // 15 minutos en milisegundos

async function checkVerification(phone, code) {
    const sanitizedPhone = sanitizePhone(phone);

    const registros = await VerificationCode.find({
        phone: sanitizedPhone,
        status: 'pendiente',
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (registros.length === 0) {
        logger.warn(`Sin códigos vigentes para ${phone}`);
        return { ok: false, mensaje: 'Código inexistente o expirado' };
    }

    for (const reg of registros) {
        const match = await bcrypt.compare(code, reg.code);
        if (match) {
            reg.status = 'verificado';
            reg.verifiedAt = new Date();
            await reg.save();
            logger.info(`Verificación correcta (ID: ${reg._id}) para ${phone}`);
            return { ok: true, mensaje: 'Código correcto' };
        }
    }

    const mostRecent = registros[0];
    mostRecent.filedAttempts += 1;
    await mostRecent.save();
    logger.warn(`Código incorrecto (${mostRecent.filedAttempts}/${maxTries}) para ${phone}`);

    if (mostRecent.filedAttempts >= maxTries) {
        await blockNumber(phone);
    }

    return { ok: false, mensaje: 'Código incorrecto' };
}

async function blockNumber(phone) {
    const now = new Date();
    const doc = await blockedPhone.findOne({ phone });

    if (doc) {
        doc.recurrences += 1;
        doc.locked_at = now;
        doc.unlocked_at = new Date(now.getTime() + blockBaseTime * doc.recurrences);
        await doc.save();
        logger.warn(`Re-bloqueo ${phone} (recurrence: ${doc.recurrences})`);
    } else {
        await blockedPhone.create({
            phone,
            locked_at: now,
            unlocked_at: new Date(now.getTime() + blockBaseTime),
            recurrences: 1
        });
        logger.warn(`Bloqueo inicial ${phone} (15min)`);
    }
}

module.exports = {
    checkVerification,
    blockNumber
};
