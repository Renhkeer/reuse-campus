const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { crearToken } = require('../auth');

const router = express.Router();

// POST /api/auth/login  { correo, password }
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
  }

  const filas = await query('SELECT * FROM usuarios WHERE correo = @correo', { correo });
  const usuario = filas[0];

  // Mismo mensaje si no existe el correo o si la clave está mala: no se da pistas
  if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
    return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
  }
  if (usuario.estado !== 'ACTIVO') {
    return res.status(403).json({ mensaje: 'Tu cuenta está desactivada' });
  }

  delete usuario.password; // nunca se devuelve el hash
  res.json({ token: crearToken(usuario), usuario });
});

module.exports = router;
