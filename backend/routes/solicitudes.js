const express = require('express');
const { query, transaccion, errorHttp } = require('../db');

const router = express.Router();

// Se une con publicaciones y usuarios para mostrar títulos y nombres
const SELECT = `
  SELECT s.*, p.titulo AS publicacion, p.usuarioId AS propietarioId, u.nombre AS solicitante
  FROM solicitudes s
  JOIN publicaciones p ON p.id = s.publicacionId
  JOIN usuarios u ON u.id = s.solicitanteId`;

// Busca una solicitud junto con su publicación; si no existe responde 404
async function buscarSolicitud(id, tx) {
  const filas = await query(
    `SELECT s.*, p.usuarioId AS propietarioId, p.estado AS estadoPublicacion
     FROM solicitudes s JOIN publicaciones p ON p.id = s.publicacionId
     WHERE s.id = @id`,
    { id: Number(id) }, tx
  );
  if (filas.length === 0) throw errorHttp(404, 'Solicitud no encontrada');
  return filas[0];
}

// GET /api/solicitudes?publicacionId=1&solicitanteId=3
router.get('/', async (req, res) => {
  const filas = await query(
    `${SELECT}
     WHERE (@publicacionId IS NULL OR s.publicacionId = @publicacionId)
       AND (@solicitanteId IS NULL OR s.solicitanteId = @solicitanteId)
     ORDER BY s.fechaSolicitud DESC`,
    {
      publicacionId: req.query.publicacionId ? Number(req.query.publicacionId) : null,
      solicitanteId: req.query.solicitanteId ? Number(req.query.solicitanteId) : null
    }
  );
  res.json(filas);
});

// GET /api/solicitudes/:id
router.get('/:id', async (req, res) => {
  const filas = await query(`${SELECT} WHERE s.id = @id`, { id: Number(req.params.id) });
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
  res.json(filas[0]);
});

// POST /api/solicitudes  { publicacionId, solicitanteId, mensaje }
router.post('/', async (req, res) => {
  const { publicacionId, solicitanteId, mensaje } = req.body;
  if (!publicacionId || !solicitanteId || !mensaje || !mensaje.trim()) {
    return res.status(400).json({ mensaje: 'Publicación, solicitante y mensaje son obligatorios' });
  }

  const pubs = await query('SELECT usuarioId, estado FROM publicaciones WHERE id = @id', { id: Number(publicacionId) });
  if (pubs.length === 0) return res.status(404).json({ mensaje: 'Publicación no encontrada' });
  const publicacion = pubs[0];

  // RN03: el dueño no puede pedir su propia publicación
  if (publicacion.usuarioId === Number(solicitanteId)) {
    return res.status(403).json({ mensaje: 'No puedes solicitar tu propia publicación' });
  }
  // RN04, RN12 y RN15: solo se solicita lo que está DISPONIBLE
  if (publicacion.estado !== 'DISPONIBLE') {
    return res.status(409).json({ mensaje: `No se puede solicitar: la publicación está ${publicacion.estado}` });
  }
  // RN05: una sola solicitud PENDIENTE por usuario y publicación
  // (el índice único de la BD también lo impide si llegan dos peticiones a la vez)
  const pendientes = await query(
    `SELECT id FROM solicitudes
     WHERE publicacionId = @publicacionId AND solicitanteId = @solicitanteId AND estado = 'PENDIENTE'`,
    { publicacionId: Number(publicacionId), solicitanteId: Number(solicitanteId) }
  );
  if (pendientes.length > 0) {
    return res.status(409).json({ mensaje: 'Ya tienes una solicitud pendiente para esta publicación' });
  }

  const filas = await query(
    `INSERT INTO solicitudes (publicacionId, solicitanteId, mensaje)
     OUTPUT INSERTED.*
     VALUES (@publicacionId, @solicitanteId, @mensaje)`,
    { publicacionId: Number(publicacionId), solicitanteId: Number(solicitanteId), mensaje: mensaje.trim() }
  );
  res.status(201).json(filas[0]);
});

// PATCH /api/solicitudes/:id/aceptar  { usuarioId }
// RN07 a RN11: todo en una transacción para que no quede a medias
router.patch('/:id/aceptar', async (req, res) => {
  const usuarioId = Number(req.body.usuarioId);

  const entrega = await transaccion(async tx => {
    const s = await buscarSolicitud(req.params.id, tx);

    // RN07: solo el dueño de la publicación decide
    if (s.propietarioId !== usuarioId) throw errorHttp(403, 'Solo el propietario puede aceptar solicitudes');
    if (s.estado !== 'PENDIENTE') throw errorHttp(409, `La solicitud ya está ${s.estado}`);

    // RN09: DISPONIBLE -> RESERVADA. El WHERE con estado evita aceptar dos veces (RN08)
    const reservada = await query(
      `UPDATE publicaciones SET estado = 'RESERVADA' OUTPUT INSERTED.id
       WHERE id = @id AND estado = 'DISPONIBLE'`,
      { id: s.publicacionId }, tx
    );
    if (reservada.length === 0) throw errorHttp(409, 'La publicación ya no está disponible');

    await query(`UPDATE solicitudes SET estado = 'ACEPTADA' WHERE id = @id`, { id: s.id }, tx);

    // RN10: las demás solicitudes pendientes quedan RECHAZADAS
    await query(
      `UPDATE solicitudes SET estado = 'RECHAZADA'
       WHERE publicacionId = @publicacionId AND estado = 'PENDIENTE'`,
      { publicacionId: s.publicacionId }, tx
    );

    // RN11: se crea la entrega PENDIENTE
    const filas = await query(
      `INSERT INTO entregas (publicacionId, solicitudId, propietarioId, receptorId)
       OUTPUT INSERTED.*
       VALUES (@publicacionId, @solicitudId, @propietarioId, @receptorId)`,
      { publicacionId: s.publicacionId, solicitudId: s.id, propietarioId: s.propietarioId, receptorId: s.solicitanteId },
      tx
    );
    return filas[0];
  });

  res.json(entrega);
});

// PATCH /api/solicitudes/:id/rechazar  { usuarioId }
router.patch('/:id/rechazar', async (req, res) => {
  const s = await buscarSolicitud(req.params.id);
  // RN07: solo el dueño de la publicación decide
  if (s.propietarioId !== Number(req.body.usuarioId)) {
    return res.status(403).json({ mensaje: 'Solo el propietario puede rechazar solicitudes' });
  }
  if (s.estado !== 'PENDIENTE') return res.status(409).json({ mensaje: `La solicitud ya está ${s.estado}` });

  await query(`UPDATE solicitudes SET estado = 'RECHAZADA' WHERE id = @id`, { id: s.id });
  res.json({ ...s, estado: 'RECHAZADA' });
});

// PATCH /api/solicitudes/:id/cancelar  { usuarioId }
router.patch('/:id/cancelar', async (req, res) => {
  const s = await buscarSolicitud(req.params.id);
  if (s.solicitanteId !== Number(req.body.usuarioId)) {
    return res.status(403).json({ mensaje: 'Solo quien hizo la solicitud puede cancelarla' });
  }
  // RN16: solo mientras esté PENDIENTE
  if (s.estado !== 'PENDIENTE') {
    return res.status(409).json({ mensaje: `Solo se puede cancelar una solicitud PENDIENTE (esta está ${s.estado})` });
  }

  await query(`UPDATE solicitudes SET estado = 'CANCELADA' WHERE id = @id`, { id: s.id });
  res.json({ ...s, estado: 'CANCELADA' });
});

module.exports = router;
