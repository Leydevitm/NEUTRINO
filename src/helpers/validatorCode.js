const { z } = require('zod');

 const verifyCodeSchema = z.object({
  phone: z.string().min(10, 'El número de teléfono es inválido'),
  code: z.string()
    .length(6, { message: 'El código debe tener exactamente 6 dígitos' })
    .regex(/^\d+$/, { message: 'El código solo debe contener números' })
});
module.exports = verifyCodeSchema;