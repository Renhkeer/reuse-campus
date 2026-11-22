const express = require('express');
const { query, transaccion, errorHttp } = require('../db');

const router = express.Router();

// Las entregas no se crean a mano: nacen al aceptar una solicitud (RN11)
const SELECT = `
  SELECT e.*, p.titulo AS publicacion, pr.nombre AS propietario, r.nombre AS receptor
  FROM entregas e
  JOIN publicaciones p ON p.id = e.publicacionId
  JOIN usuarios pr ON pr.id = e.propietarioId
  JOIN usuarios r ON r.id = e.receptorId`;

// GET /api/entregas
// Un usuario ve solo las entregas donde participa; el admin las ve todas
router.get('/', async (req, res) => {
  const usuarioId = req.usuario.rol === 'ADMIN' ? null : req.usuario.id;
  const filas = await query(
    `${SELECT}
     WHERE @usuarioId IS NULL OR e.propietarioId = @usuarioId OR e.receptorId = @usuarioId
     ORDER BY e.fechaAcuerdo DESC`,
    { usuarioId }
  );
  res.json(filas);
});

// GET /api/entregas/:id
router.get('/:id', async (req, res) => {
  const filas = await query(`${SELECT} WHERE e.id = @id`, { id: Number(req.params.id) });
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Entrega no encontrada' });
  res.json(filas[0]);
});

// PATCH /api/entregas/:id/completar
// RN14: la entrega pasa a COMPLETADA y la publicación a ENTREGADA, juntas
router.patch('/:id/completar', async (req, res) => {
  const entrega = await transaccion(async tx => {
    const filas = await query('SELECT * FROM entregas WHERE id = @id', { id: Number(req.params.id) }, tx);
    if (filas.length === 0) throw errorHttp(404, 'Entrega no encontrada');
    const e = filas[0];

    // El propietario confirma que entregó el artículo
    if (e.propietarioId !== req.usuario.id) {
      throw errorHttp(403, 'Solo el propietario puede confirmar la entrega');
    }
    if (e.estado !== 'PENDIENTE') throw errorHttp(409, 'La entrega ya fue completada');

    // RN13: solo una publicación RESERVADA puede pasar a ENTREGADA
    const actualizada = await query(
      `UPDATE publicaciones SET estado = 'ENTREGADA' OUTPUT INSERTED.id
       WHERE id = @id AND estado = 'RESERVADA'`,
      { id: e.publicacionId }, tx
    );
    if (actualizada.length === 0) throw errorHttp(409, 'La publicación no está RESERVADA');

    const completada = await query(
      `UPDATE entregas SET estado = 'COMPLETADA', fechaEntrega = SYSDATETIME()
       OUTPUT INSERTED.* WHERE id = @id`,
      { id: e.id }, tx
    );
    return completada[0];
  });

  res.json(entrega);
});

module.exports = router;
