// Pruebas de la API contra la base real.
// Antes: correr database/schema.sql (deja los datos de prueba) y levantar la API (npm start).
// Ejecutar: npm test
const { test } = require('node:test');
const assert = require('node:assert');

const API = 'http://localhost:3000/api';

// Hace una petición y devuelve { status, body }
async function pedir(metodo, ruta, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API + ruta, { method: metodo, headers, body: body && JSON.stringify(body) });
  const texto = await res.text();
  return { status: res.status, body: texto ? JSON.parse(texto) : null };
}

async function login(correo) {
  const res = await pedir('POST', '/auth/login', null, { correo, password: '123456' });
  assert.strictEqual(res.status, 200, 'no se pudo iniciar sesión con ' + correo);
  return res.body.token;
}

test('login y roles', async () => {
  assert.strictEqual((await pedir('POST', '/auth/login', null, { correo: 'ana@ipvg.cl', password: 'mala' })).status, 401);
  assert.strictEqual((await pedir('POST', '/auth/login', null, { correo: 'ana@ipvg.cl' })).status, 400);
  assert.strictEqual((await pedir('GET', '/publicaciones')).status, 401, 'sin token no se entra');
  assert.strictEqual((await pedir('GET', '/publicaciones', 'token-falso')).status, 401);

  const ana = await login('ana@ipvg.cl');
  const admin = await login('admin@ipvg.cl');
  assert.strictEqual((await pedir('GET', '/usuarios', ana)).status, 403, 'un usuario normal no ve usuarios');
  assert.strictEqual((await pedir('GET', '/usuarios', admin)).status, 200);
});

test('flujo completo y reglas de negocio', async () => {
  const ana = await login('ana@ipvg.cl');
  const benja = await login('benja@ipvg.cl');
  const carla = await login('carla@ipvg.cl');

  // RN01: Ana publica (el dueño sale del token)
  const pub = await pedir('POST', '/publicaciones', ana,
    { titulo: 'Multímetro', descripcion: 'Digital', categoria: 'Componentes', modalidad: 'DONACION' });
  assert.strictEqual(pub.status, 201);
  const id = pub.body.id;

  // Validaciones de datos
  assert.strictEqual((await pedir('POST', '/publicaciones', ana, { titulo: 'x' })).status, 400);
  assert.strictEqual((await pedir('POST', '/publicaciones', ana,
    { titulo: 'x', descripcion: 'y', categoria: 'z', modalidad: 'VENTA' })).status, 400);

  // RN03: no puede solicitar su propia publicación
  assert.strictEqual((await pedir('POST', '/solicitudes', ana, { publicacionId: id, mensaje: 'yo' })).status, 403);

  // RN06: dos usuarios distintos solicitan
  const s1 = await pedir('POST', '/solicitudes', benja, { publicacionId: id, mensaje: 'Me sirve' });
  const s2 = await pedir('POST', '/solicitudes', carla, { publicacionId: id, mensaje: 'A mí también' });
  assert.strictEqual(s1.status, 201);
  assert.strictEqual(s2.status, 201);

  // RN05: solicitud duplicada
  assert.strictEqual((await pedir('POST', '/solicitudes', benja, { publicacionId: id, mensaje: 'otra' })).status, 409);
  // Recurso inexistente
  assert.strictEqual((await pedir('POST', '/solicitudes', benja, { publicacionId: 99999, mensaje: 'x' })).status, 404);

  // RN07: solo el dueño acepta; nadie más edita
  assert.strictEqual((await pedir('PATCH', `/solicitudes/${s1.body.id}/aceptar`, carla)).status, 403);
  assert.strictEqual((await pedir('PUT', `/publicaciones/${id}`, benja,
    { titulo: 'x', descripcion: 'y', categoria: 'z', modalidad: 'DONACION' })).status, 403);

  // Ana acepta la de Benja
  const aceptada = await pedir('PATCH', `/solicitudes/${s1.body.id}/aceptar`, ana);
  assert.strictEqual(aceptada.status, 200);
  assert.strictEqual(aceptada.body.estado, 'PENDIENTE', 'RN11: se crea la entrega PENDIENTE');

  assert.strictEqual((await pedir('GET', `/publicaciones/${id}`, ana)).body.estado, 'RESERVADA', 'RN09');
  assert.strictEqual((await pedir('GET', `/solicitudes/${s2.body.id}`, ana)).body.estado, 'RECHAZADA', 'RN10');

  // RN08 y RN12: no se acepta otra ni se reciben nuevas solicitudes
  assert.strictEqual((await pedir('PATCH', `/solicitudes/${s2.body.id}/aceptar`, ana)).status, 409);
  assert.strictEqual((await pedir('POST', '/solicitudes', carla, { publicacionId: id, mensaje: 'x' })).status, 409);
  // RN16: Benja ya no puede cancelar una solicitud ACEPTADA
  assert.strictEqual((await pedir('PATCH', `/solicitudes/${s1.body.id}/cancelar`, benja)).status, 409);

  // Solo el propietario confirma la entrega
  const entregaId = aceptada.body.id;
  assert.strictEqual((await pedir('PATCH', `/entregas/${entregaId}/completar`, benja)).status, 403);
  const completada = await pedir('PATCH', `/entregas/${entregaId}/completar`, ana);
  assert.strictEqual(completada.status, 200);
  assert.strictEqual(completada.body.estado, 'COMPLETADA');

  // RN14 y RN15
  assert.strictEqual((await pedir('GET', `/publicaciones/${id}`, ana)).body.estado, 'ENTREGADA');
  assert.strictEqual((await pedir('POST', '/solicitudes', carla, { publicacionId: id, mensaje: 'x' })).status, 409);
});

test('cancelar solicitudes y publicaciones', async () => {
  const ana = await login('ana@ipvg.cl');
  const benja = await login('benja@ipvg.cl');
  const carla = await login('carla@ipvg.cl');
  const admin = await login('admin@ipvg.cl');

  const pub = await pedir('POST', '/publicaciones', ana,
    { titulo: 'Regla T', descripcion: 'Metálica', categoria: 'Materiales', modalidad: 'INTERCAMBIO' });
  const id = pub.body.id;

  // RN16: solo el solicitante y solo si está PENDIENTE
  const s = await pedir('POST', '/solicitudes', benja, { publicacionId: id, mensaje: 'La necesito' });
  assert.strictEqual((await pedir('PATCH', `/solicitudes/${s.body.id}/cancelar`, carla)).status, 403);
  assert.strictEqual((await pedir('PATCH', `/solicitudes/${s.body.id}/cancelar`, benja)).status, 200);

  // RN17: cancelar no borra; un usuario no cancela lo ajeno, el admin sí
  assert.strictEqual((await pedir('DELETE', `/publicaciones/${id}`, benja)).status, 403);
  assert.strictEqual((await pedir('DELETE', `/publicaciones/${id}`, admin)).status, 204);
  assert.strictEqual((await pedir('GET', `/publicaciones/${id}`, ana)).body.estado, 'CANCELADA');

  // RN04: no se solicita una publicación CANCELADA
  assert.strictEqual((await pedir('POST', '/solicitudes', carla, { publicacionId: id, mensaje: 'x' })).status, 409);
});
