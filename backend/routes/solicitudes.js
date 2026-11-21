const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Se une con publicaciones y usuarios para mostrar títulos y nombres
const SELECT = `
  SELECT s.*, p.titulo AS publicacion, u.nombre AS solicitante
  FROM solicitudes s
  JOIN publicaciones p ON p.id = s.publicacionId
  JOIN usuarios u ON u.id = s.solicitanteId`;

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
// Etapa 2: solo guarda. Las reglas RN03, RN04, RN12 y RN15 se agregan en la etapa 4
router.post('/', async (req, res) => {
  const { publicacionId, solicitanteId, mensaje } = req.body;
  if (!publicacionId || !solicitanteId || !mensaje) {
    return res.status(400).json({ mensaje: 'Publicación, solicitante y mensaje son obligatorios' });
  }

  const filas = await query(
    `INSERT INTO solicitudes (publicacionId, solicitanteId, mensaje)
     OUTPUT INSERTED.*
     VALUES (@publicacionId, @solicitanteId, @mensaje)`,
    { publicacionId: Number(publicacionId), solicitanteId: Number(solicitanteId), mensaje }
  );
  res.status(201).json(filas[0]);
});

module.exports = router;
