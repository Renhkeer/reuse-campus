const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');

const router = express.Router();

// Nunca se devuelve la columna password
const CAMPOS = 'id, nombre, correo, rol, estado';
const CAMPOS_INSERTED = 'INSERTED.id, INSERTED.nombre, INSERTED.correo, INSERTED.rol, INSERTED.estado';

// GET /api/usuarios
router.get('/', async (req, res) => {
  const usuarios = await query(`SELECT ${CAMPOS} FROM usuarios ORDER BY id`);
  res.json(usuarios);
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
  const filas = await query(`SELECT ${CAMPOS} FROM usuarios WHERE id = @id`, { id: Number(req.params.id) });
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  res.json(filas[0]);
});

// POST /api/usuarios  { nombre, correo, password }
router.post('/', async (req, res) => {
  const { nombre, correo, password } = req.body;
  if (!nombre || !correo || !password) {
    return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
  }
  if (!correo.includes('@')) return res.status(400).json({ mensaje: 'El correo no es válido' });
  if (password.length < 6) return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });

  const hash = await bcrypt.hash(password, 10);
  const filas = await query(
    `INSERT INTO usuarios (nombre, correo, password) OUTPUT ${CAMPOS_INSERTED}
     VALUES (@nombre, @correo, @hash)`,
    { nombre, correo, hash }
  );
  res.status(201).json(filas[0]);
});

// PUT /api/usuarios/:id  { nombre, correo }
router.put('/:id', async (req, res) => {
  const { nombre, correo } = req.body;
  if (!nombre || !correo) return res.status(400).json({ mensaje: 'Nombre y correo son obligatorios' });
  if (!correo.includes('@')) return res.status(400).json({ mensaje: 'El correo no es válido' });

  const filas = await query(
    `UPDATE usuarios SET nombre = @nombre, correo = @correo OUTPUT ${CAMPOS_INSERTED} WHERE id = @id`,
    { id: Number(req.params.id), nombre, correo }
  );
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  res.json(filas[0]);
});

// DELETE /api/usuarios/:id -> no se borra (RN17), queda INACTIVO
router.delete('/:id', async (req, res) => {
  const filas = await query(
    `UPDATE usuarios SET estado = 'INACTIVO' OUTPUT INSERTED.id WHERE id = @id`,
    { id: Number(req.params.id) }
  );
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  res.status(204).end();
});

module.exports = router;
