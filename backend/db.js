// Conexión a SQL Server Express con autenticación de Windows (driver ODBC 17)
const sql = require('mssql/msnodesqlv8');

const config = {
  connectionString: process.env.DB_CONNECTION ||
    'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=reuse_campus;Trusted_Connection=yes;',
  // La BD guarda la hora local de Chile (SYSDATETIME), no UTC
  options: { useUTC: false }
};

// Un solo pool de conexiones para toda la app
const pool = new sql.ConnectionPool(config);
const poolListo = pool.connect();

// Ejecuta una consulta con parámetros: query('SELECT ... WHERE id = @id', { id: 5 })
// Los parámetros evitan inyección SQL (nunca se concatena texto del usuario).
// Si se pasa tx, la consulta corre dentro de esa transacción.
async function query(texto, params = {}, tx = null) {
  await poolListo;
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const nombre in params) {
    request.input(nombre, params[nombre]);
  }
  const resultado = await request.query(texto);
  return resultado.recordset;
}

// Ejecuta varias consultas como una sola operación: o se guardan todas o ninguna.
// Uso: await transaccion(async tx => { await query('...', {...}, tx); ... });
async function transaccion(pasos) {
  await poolListo;
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const resultado = await pasos(tx);
    await tx.commit();
    return resultado;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

// Crea un error con código HTTP; el manejador de server.js lo responde
function errorHttp(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

module.exports = { query, transaccion, errorHttp, pool, poolListo, sql };
