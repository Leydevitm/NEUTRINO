const sanitizePhone = (phoneNumber) => {
    if (!phoneNumber) return null;

    // Eliminar todos los caracteres no numéricos
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Si ya incluye LADA internacional 52
    if (digitsOnly.startsWith('52') && digitsOnly.length === 12) {
        return `+${digitsOnly}`;
    }

    // Si es un número nacional de 10 dígitos
    if (digitsOnly.length === 10) {
        return `+52${digitsOnly}`;
    }

    // Si no cumple ningún formato esperado
    return null;
};

module.exports = sanitizePhone;
