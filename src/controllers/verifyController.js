const { sendCode,
  checkVerifyCode } = require('../helpers/smsVerificationHelpers');

const startVerificationController = async (req, res) => {
    const { sanitizedPhone } = req;

    try {
        const resultado = await sendCode(sanitizedPhone);
        res.status(resultado.ok ? 200 : 400).json(resultado);
    } catch (error) {
        res.status(500).json({ error: 'Error interno al iniciar verificación' });
    }
};

const checkVerificationController = async (req, res) => {
    const { sanitizedPhone } = req;
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Código obligatorio' });
    }

    try {
        const resultado = await checkVerifyCode(sanitizedPhone, code);
        res.status(resultado.ok ? 200 : 400).json(resultado);
    } catch (error) {
        res.status(500).json({ error: 'Error interno al verificar código' });
    }
};

module.exports = {
    startVerificationController,
    
    checkVerificationController
};