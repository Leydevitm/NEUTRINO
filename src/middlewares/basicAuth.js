
const basicAuth = require('basic-auth');


const authMiddleware = (req, res, next) => {
    const credentials = basicAuth(req);

    if (!credentials || !credentials.name || !credentials.pass) {
        res.set('WWW-Authenticate', 'Basic realm="neutrino-service"');
        return res.status(401).json({ msg: 'Credenciales requeridas: usuario y contraseña' });
    }

    const { name: inputUser, pass: inputPass } = credentials;
    const validUser = inputUser === process.env.BASIC_AUTH_USER;
    const validPass = inputPass === process.env.BASIC_AUTH_PASS;

   if (!validUser && !validPass) {
    return res.status(401).json({ msg: 'Credenciales incorrectas' });
  }

  if (!validUser) {
    return res.status(401).json({ msg: 'Usuario incorrecto' });
  }

  if (!validPass) {
    return res.status(401).json({ msg: 'Contraseña incorrecta' });
  }
    next();
}
module.exports = authMiddleware;