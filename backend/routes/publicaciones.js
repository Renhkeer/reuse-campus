const express = require('express');
const { query, transaccion, errorHttp } = require('../db');

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

// POST /api/publicaciones  { titulo, descripcion, categoria, modalidad }
// RN01 y RN02: el dueño es el usuario del token, no algo que mande el navegador
router.post('/', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ mensaje: error });

  const { titulo, descripcion, categoria, modalidad } = req.body;
  const filas = await query(
    `INSERT INTO publicaciones (titulo, descripcion, categoria, modalidad, usuarioId)
     OUTPUT INSERTED.*
     VALUES (@titulo, @descripcion, @categoria, @modalidad, @usuarioId)`,
    { titulo, descripcion, categoria, modalidad, usuarioId: req.usuario.id }
  );
  res.status(201).json(filas[0]);
});

// Revisa que la publicación exista, que sea del usuario y que siga DISPONIBLE.
// Con permitirAdmin = true el administrador también pasa (para moderar).
async function buscarPropia(id, usuario, tx, permitirAdmin = false) {
  const filas = await query('SELECT * FROM publicaciones WHERE id = @id', { id: Number(id) }, tx);
  if (filas.length === 0) throw errorHttp(404, 'Publicación no encontrada');
  const p = filas[0];
  const puede = p.usuarioId === usuario.id || (permitirAdmin && usuario.rol === 'ADMIN');
  if (!puede) throw errorHttp(403, 'Solo el propietario puede modificar esta publicación');
  if (p.estado !== 'DISPONIBLE') throw errorHttp(409, `No se puede modificar: la publicación está ${p.estado}`);
  return p;
}

// PUT /api/publicaciones/:id  { titulo, descripcion, categoria, modalidad }
// El estado no se cambia aquí: lo cambian las reglas de negocio
router.put('/:id', async (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ mensaje: error });
  await buscarPropia(req.params.id, req.usuario);

  const { titulo, descripcion, categoria, modalidad } = req.body;
  const filas = await query(
    `UPDATE publicaciones
     SET titulo = @titulo, descripcion = @descripcion, categoria = @categoria, modalidad = @modalidad
     OUTPUT INSERTED.*
     WHERE id = @id`,
    { id: Number(req.params.id), titulo, descripcion, categoria, modalidad }
  );
  res.json(filas[0]);
});

// DELETE /api/publicaciones/:id  (el dueño o un admin)
// No se borra (RN17): pasa a CANCELADA y sus solicitudes pendientes quedan RECHAZADAS
router.delete('/:id', async (req, res) => {
  await transaccion(async tx => {
    const p = await buscarPropia(req.params.id, req.usuario, tx, true);
    await query(`UPDATE publicaciones SET estado = 'CANCELADA' WHERE id = @id`, { id: p.id }, tx);
    await query(
      `UPDATE solicitudes SET estado = 'RECHAZADA' WHERE publicacionId = @id AND estado = 'PENDIENTE'`,
      { id: p.id }, tx
    );
  });
  res.status(204).end();
});

module.exports = router;
