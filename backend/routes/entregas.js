const express = require('express');
const { query } = require('../db');

const router = express.Router();

// Las entregas no se crean a mano: nacen al aceptar una solicitud (RN11, etapa 4)
const SELECT = `
  SELECT e.*, p.titulo AS publicacion, pr.nombre AS propietario, r.nombre AS receptor
  FROM entregas e
  JOIN publicaciones p ON p.id = e.publicacionId
  JOIN usuarios pr ON pr.id = e.propietarioId
  JOIN usuarios r ON r.id = e.receptorId`;

// GET /api/entregas?usuarioId=2  (entregas donde participa como propietario o receptor)
router.get('/', async (req, res) => {
  const filas = await query(
    `${SELECT}
     WHERE @usuarioId IS NULL OR e.propietarioId = @usuarioId OR e.receptorId = @usuarioId
     ORDER BY e.fechaAcuerdo DESC`,
    { usuarioId: req.query.usuarioId ? Number(req.query.usuarioId) : null }
  );
  res.json(filas);
});

// GET /api/entregas/:id
router.get('/:id', async (req, res) => {
  const filas = await query(`${SELECT} WHERE e.id = @id`, { id: Number(req.params.id) });
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Entrega no encontrada' });
  res.json(filas[0]);
});

module.exports = router;
