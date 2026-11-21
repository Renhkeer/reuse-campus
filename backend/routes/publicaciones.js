const express = require('express');
const { query } = require('../db');

const router = express.Router();

const MODALIDADES = ['DONACION', 'INTERCAMBIO'];

// Se une con usuarios para mostrar el nombre del propietario
const SELECT = `
  SELECT p.*, u.nombre AS propietario
  FROM publicaciones p JOIN usuarios u ON u.id = p.usuarioId`;

// Revisa los campos del formulario; devuelve el mensaje de error o null
function validar({ titulo, descripcion, categoria, modalidad }) {
  if (!titulo || !descripcion || !categoria || !modalidad) {
    return 'Título, descripción, categoría y modalidad son obligatorios';
  }
  if (!MODALIDADES.includes(modalidad)) return 'La modalidad debe ser DONACION o INTERCAMBIO';
  return null;
}

// GET /api/publicaciones?estado=DISPONIBLE&usuarioId=2
router.get('/', async (req, res) => {
  const filas = await query(
    `${SELECT}
     WHERE (@estado IS NULL OR p.estado = @estado)
       AND (@usuarioId IS NULL OR p.usuarioId = @usuarioId)
     ORDER BY p.fechaPublicacion DESC`,
    { estado: req.query.estado || null, usuarioId: req.query.usuarioId ? Number(req.query.usuarioId) : null }
  );
  res.json(filas);
});

// GET /api/publicaciones/:id
router.get('/:id', async (req, res) => {
  const filas = await query(`${SELECT} WHERE p.id = @id`, { id: Number(req.params.id) });
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Publicación no encontrada' });
  res.json(filas[0]);
});

// POST /api/publicaciones  { titulo, descripcion, categoria, modalidad, usuarioId }
// Etapa 2: usuarioId viene en el cuerpo; con el login saldrá del token (RN01)
router.post('/', async (req, res) => {
  const error = validar(req.body) || (!req.body.usuarioId && 'El usuario propietario es obligatorio');
  if (error) return res.status(400).json({ mensaje: error });

  const { titulo, descripcion, categoria, modalidad, usuarioId } = req.body;
  const filas = await query(
    `INSERT INTO publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
     OUTPUT INSERTED.*
     VALUES (@titulo, @descripcion, @categoria, @modalidad, @usuarioId)`,
    { titulo, descripcion, categoria, modalidad, usuarioId: Number(usuarioId) }
  );
  res.status(201).json(filas[0]);
});

// PUT /api/publicaciones/:id  { titulo, descripcion, categoria, modalidad }
// El estado no se cambia aquí: lo cambian las reglas de negocio
router.put('/:id', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  const { titulo, descripcion, categoria, modalidad } = req.body;
  const filas = await query(
    `UPDATE publicaciones
     SET titulo = @titulo, descripcion = @descripcion, categoria = @categoria, modalidad = @modalidad
     OUTPUT INSERTED.*
     WHERE id = @id`,
    { id: Number(req.params.id), titulo, descripcion, categoria, modalidad }
  );
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Publicación no encontrada' });
  res.json(filas[0]);
});

// DELETE /api/publicaciones/:id -> no se borra (RN17), pasa a CANCELADA
router.delete('/:id', async (req, res) => {
  const filas = await query(
    `UPDATE publicaciones SET estado = 'CANCELADA' OUTPUT INSERTED.id WHERE id = @id`,
    { id: Number(req.params.id) }
  );
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Publicación no encontrada' });
  res.status(204).end();
});

module.exports = router;
