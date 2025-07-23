const sanitizePhone = require( '../utils/phoneSanitizer');

 async function sendCode(req, res) {
  const { phone } = req.body;


  if (!phone || phone.trim() === '') {
    return res.status(400).json({ error: 'Número telefónico requerido' });
  }

  const sanitizedPhone = sanitizePhone(phone);

  if (!sanitizedPhone) {
    return res.status(400).json({ error: 'Número inválido. Debe tener 10 dígitos numéricos' });
  }

  const fakeCode = '123456';
  console.log(`Código simulado enviado a ${sanitizedPhone}`);

  res.status(200).json({
    message: `Código enviado correctamente a ${sanitizedPhone}`,
    simulatedCode: fakeCode
  });
}
module.exports = {
  sendCode
};
