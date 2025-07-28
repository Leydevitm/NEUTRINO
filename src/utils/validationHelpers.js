const sanitizePhone = require('./phoneSanitizer');

const validatePhone = (phone) => {
    if (!phone) return { valid: false, message: 'Número requerido' };

    const sanitized = sanitizePhone(phone);
    if (!sanitized) return { valid: false, message: 'Número inválido' };

    return { valid: true, phone: sanitized };
};

const validateCodeFormat = (code) => {
    if (!code || typeof code !== 'string') {
        return { valid: false, message: 'Código requerido' };
    }

    const regex = /^\d{6}$/;
    if (!regex.test(code)) {
        return { valid: false, message: 'Código inválido. Debe tener exactamente 6 dígitos.' };
    }

    return { valid: true };
};

module.exports = {
    validatePhone,
    validateCodeFormat,
};
