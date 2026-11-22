const jwt = require('jsonwebtoken');

// shortcut: clave por defecto solo para desarrollo local; en un servidor real se define JWT_SECRET
const SECRETO = process.env.JWT_SECRET || 'reuse-campus-desarrollo';

// Crea el token que Angular guarda y manda en cada petición
function crearToken(usuario) {
  return jwt.sign({ id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }, SECRETO, { expiresIn: '8h' });
}

// Middleware: exige "Authorization: Bearer <token>" y deja el usuario en req.usuario
function requiereLogin(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }
  try {
    req.usuario = jwt.verify(token, SECRETO);
    next();
  } catch {
    res.status(401).json({ mensaje: 'La sesión expiró o no es válida, vuelve a iniciar sesión' });
  }
}

// Middleware: además del login, exige rol ADMIN (va después de requiereLogin)
function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'ADMIN') {
    return res.status(403).json({ mensaje: 'Solo un administrador puede hacer esto' });
  }
  next();
}

module.exports = { crearToken, requiereLogin, soloAdmin };
