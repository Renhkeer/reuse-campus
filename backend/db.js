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
// Los parámetros evitan inyección SQL (nunca se concatena texto del usuario)
async function query(texto, params = {}) {
  await poolListo;
  const request = pool.request();
  for (const nombre in params) {
    request.input(nombre, params[nombre]);
  }
  const resultado = await request.query(texto);
  return resultado.recordset;
}

module.exports = { query, pool, poolListo, sql };
