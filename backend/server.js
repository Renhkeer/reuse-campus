const express = require('express');
const cors = require('cors');
const { poolListo } = require('./db');
const { requiereLogin, soloAdmin } = require('./auth');

const app = express();
app.use(cors());           // permite que Angular (localhost:4200) llame a la API
app.use(express.json());   // lee el cuerpo JSON de las peticiones

// Todas las rutas piden login, menos el login mismo. Usuarios es solo para el admin.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', requiereLogin, soloAdmin, require('./routes/usuarios'));
app.use('/api/publicaciones', requiereLogin, require('./routes/publicaciones'));
app.use('/api/solicitudes', requiereLogin, require('./routes/solicitudes'));
app.use('/api/entregas', requiereLogin, require('./routes/entregas'));

// Ruta que no existe
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejo central de errores: Express 5 manda aquí los errores de las rutas async
app.use((err, req, res, next) => {
  // Errores de negocio lanzados con errorHttp (403, 404, 409...)
  if (err.status) {
    return res.status(err.status).json({ mensaje: err.message });
  }
  // Errores de SQL Server que son culpa de los datos enviados
  if (err.number === 2627 || err.number === 2601) {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos' });
  }
  if (err.number === 547) {
    return res.status(400).json({ mensaje: 'Los datos hacen referencia a un registro que no existe' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

const PUERTO = process.env.PORT || 3000;
poolListo
  .then(() => app.listen(PUERTO, () => console.log(`API en http://localhost:${PUERTO}`)))
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });
