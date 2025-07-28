const blockedPhone = require('../models/blockedPhone');
const logger = require('../utils/logger');
const sanitizePhone = require('../utils/phoneSanitizer'); 

const attemptLimit = async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: 'Número telefónico requerido' });
    }

    const sanitizedPhone = sanitizePhone(phone);

    if (!sanitizedPhone) {
        return res.status(403).json({ 
            error: 'Número telefónico inválido. Debe tener formato +521234567890' 
        });
    }

    const block = await blockedPhone.findOne({ phone: sanitizedPhone });

    if (block) {
        const unlocked_atStr = block.unlocked_at.toLocaleTimeString();
        let razon = 'bloqueo por actividad sospechosa';

        switch (req.method) {
            case 'POST':
                if (req.originalUrl.includes('/start')) {
                    razon = 'envío excesivo de códigos';
                } else if (req.originalUrl.includes('/check')) {
                    razon = 'verificación fallida repetida';
                } else {
                    razon = 'solicitudes POST excesivas';
                }
                break;
            case 'GET':
                razon = 'acceso GET bloqueado';
                break;
            case 'PUT':
                razon = 'modificaciones bloqueadas';
                break;
            case 'DELETE':
                razon = 'función bloqueada';
                break;
        }

        logger.warn(`${sanitizedPhone} bloqueado al intentar ${req.method} -> ${req.originalUrl} | razón: ${razon}`);

        return res.status(429).json({
            error: `Demasiados intentos fallidos. Vuelve después de ${unlocked_atStr}`,
            motivo: razon
        });
    }

  
    req.sanitizedPhone = sanitizedPhone;

    next();
};

module.exports = attemptLimit;
