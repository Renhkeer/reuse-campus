# ReUse Campus

Plataforma de economía circular para la comunidad del IPVG: los integrantes publican artículos que ya no usan (libros, calculadoras, componentes, materiales…) para donarlos o intercambiarlos. Otros usuarios los solicitan, el propietario acepta una solicitud y el sistema controla los estados hasta que el artículo se entrega, conservando el historial.

Evaluación integradora del **Electivo Angular**, Ingeniería en Informática, IPVG sede Chillán.

**Autor:** Benjamin Canahuate

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, signals, formularios reactivos, HttpClient) |
| Backend | Node.js 26 + Express 5 |
| Base de datos | SQL Server Express (relacional) |
| Conexión a la BD | `mssql` con el driver `msnodesqlv8` (autenticación de Windows, ODBC Driver 17) |
| Seguridad | JWT (`jsonwebtoken`) y contraseñas con hash `bcryptjs` |
| Pruebas | `node:test` (pruebas de la API) |

## Requisitos

- Windows con **SQL Server Express** (instancia `localhost\SQLEXPRESS`) y **ODBC Driver 17 for SQL Server**.
- **Node.js** 20 o superior (probado con Node 26) y npm.
- `sqlcmd` o SQL Server Management Studio para crear la base.

## Configuración de la base de datos

El script `database/schema.sql` crea la base `reuse_campus`, las 4 tablas con sus claves y restricciones, y carga datos de prueba. **Si las tablas ya existen, las borra y las vuelve a crear.**

```bash
sqlcmd -S localhost\SQLEXPRESS -E -f 65001 -i database/schema.sql
```

(`-E` usa la cuenta de Windows y `-f 65001` lee el archivo como UTF-8 para que los tildes queden bien.) También se puede abrir y ejecutar en SSMS.

La API se conecta con autenticación de Windows. Para usar otro servidor, definir la variable `DB_CONNECTION` con la cadena ODBC completa antes de iniciar la API.

### Usuarios de prueba (contraseña `123456`)

| Correo | Rol |
|---|---|
| admin@ipvg.cl | Administrador |
| ana@ipvg.cl | Usuario (dueña de 2 publicaciones) |
| benja@ipvg.cl | Usuario |
| carla@ipvg.cl | Usuario |

## Instalación y ejecución

En dos terminales:

```bash
# 1. API (http://localhost:3000)
cd backend
npm install
npm start

# 2. Frontend (http://localhost:4200)
cd frontend
npm install
npm start
```

Abrir http://localhost:4200 e iniciar sesión con uno de los usuarios de prueba.

## Estructura de la solución

```
database/schema.sql          tablas, claves, CHECK de estados, índices únicos y datos de prueba
backend/
  server.js                  arranca Express, monta las rutas y maneja los errores
  db.js                      conexión a SQL Server, query() con parámetros y transaccion()
  auth.js                    JWT: crearToken, requiereLogin y soloAdmin
  routes/                    una ruta por recurso: auth, usuarios, publicaciones, solicitudes, entregas
  pruebas/reglas.test.js     pruebas del flujo, las reglas de negocio y los errores
frontend/src/app/
  api.ts                     servicio con todas las llamadas HttpClient y mensajeError()
  sesion.ts                  usuario y token de la sesión (localStorage)
  auth.ts                    interceptor que agrega el token y guards de login y admin
  models.ts                  interfaces de las 4 entidades
  paginas/                   login, publicaciones (lista, detalle, formulario), mis solicitudes, entregas, usuarios
```

Flujo de una operación: componente Angular → `Api` (HttpClient + token) → ruta Express → `requiereLogin` → validación y regla de negocio → SQL Server (transacción si cambia varias tablas) → respuesta JSON con código HTTP → la página muestra el resultado o el mensaje de error y recarga los datos.

### Modelo de datos

- **usuarios** (id, nombre, correo único, password con hash, rol `USUARIO`/`ADMIN`, estado `ACTIVO`/`INACTIVO`)
- **publicaciones** (…, modalidad `DONACION`/`INTERCAMBIO`, estado `DISPONIBLE`/`RESERVADA`/`ENTREGADA`/`CANCELADA`, `usuarioId` → usuarios)
- **solicitudes** (`publicacionId` → publicaciones, `solicitanteId` → usuarios, mensaje, estado `PENDIENTE`/`ACEPTADA`/`RECHAZADA`/`CANCELADA`)
- **entregas** (`publicacionId`, `solicitudId` único, `propietarioId`, `receptorId`, fechas, estado `PENDIENTE`/`COMPLETADA`)

### API REST

Todas las rutas, menos el login, piden el header `Authorization: Bearer <token>`.

| Método y ruta | Qué hace |
|---|---|
| `POST /api/auth/login` | Inicia sesión y devuelve token y usuario |
| `GET /api/publicaciones?estado=` · `GET /:id` | Lista o ve publicaciones |
| `POST /api/publicaciones` | Crea una publicación (dueño = usuario del token) |
| `PUT /api/publicaciones/:id` | Edita (solo el dueño, solo si está DISPONIBLE) |
| `DELETE /api/publicaciones/:id` | Cancela, no borra (dueño o admin) |
| `GET /api/solicitudes?publicacionId=&solicitanteId=` · `GET /:id` | Lista o ve solicitudes |
| `POST /api/solicitudes` | Solicita una publicación |
| `PATCH /api/solicitudes/:id/aceptar` · `/rechazar` | El dueño decide |
| `PATCH /api/solicitudes/:id/cancelar` | El solicitante cancela su solicitud pendiente |
| `GET /api/entregas` · `GET /:id` | Entregas del usuario (el admin ve todas) |
| `PATCH /api/entregas/:id/completar` | El dueño confirma la entrega |
| `GET/POST /api/usuarios`, `PUT/DELETE /:id`, `PATCH /:id/activar` | Gestión de usuarios (solo admin) |

Códigos usados: 200, 201, 204, 400 (datos inválidos), 401 (sin sesión), 403 (sin permiso), 404 (no existe), 409 (el estado no lo permite o el dato está duplicado) y 500.

## Funcionalidades implementadas

- Login con JWT; la sesión se mantiene al recargar y vuelve al login si el token vence.
- Roles: el **usuario** publica, solicita, decide sobre sus publicaciones y confirma entregas; el **administrador** además gestiona usuarios (crear, activar y desactivar), ve todas las entregas y puede cancelar cualquier publicación.
- CRUD de publicaciones con formulario validado; listado filtrable por estado.
- Solicitudes, aceptación, rechazo, cancelación y entregas, con todas las reglas de negocio.
- Mensajes claros para cada error de la API y para cuando la API no responde.

### Dónde se cumple cada regla de negocio

| Regla | Dónde |
|---|---|
| RN01 | `server.js` (`requiereLogin` en publicaciones) y `routes/publicaciones.js` POST (el dueño sale del token) |
| RN02 | FK `publicaciones.usuarioId` en `schema.sql` |
| RN03, RN04, RN05, RN06, RN12, RN15 | `routes/solicitudes.js` POST; RN05 también con el índice único `UX_solicitud_pendiente` |
| RN07, RN08, RN09, RN10, RN11 | `routes/solicitudes.js` `/aceptar` (en una transacción); RN08 también con el índice `UX_solicitud_aceptada` |
| RN13, RN14 | `routes/entregas.js` `/completar` (solo una publicación RESERVADA pasa a ENTREGADA) |
| RN16 | `routes/solicitudes.js` `/cancelar` |
| RN17 | Nada se borra: DELETE cambia el estado a CANCELADA o INACTIVO |
| RN18 | Cada regla se valida en el backend; en Angular solo se ocultan los botones |

## Pruebas realizadas

**Automáticas** (`backend/pruebas/reglas.test.js`). Con la base recién creada y la API encendida:

```bash
cd backend
npm test
```

Prueban:
- Login correcto, contraseña incorrecta, datos faltantes, petición sin token o con token falso, y un usuario normal que intenta entrar a la gestión de usuarios.
- El flujo completo de la sección 7: Ana publica, Benja y Carla solicitan, Ana acepta la de Benja → publicación RESERVADA, la de Carla RECHAZADA, entrega PENDIENTE → Ana confirma → entrega COMPLETADA y publicación ENTREGADA.
- Situaciones inválidas: solicitar lo propio, solicitud duplicada, solicitar algo RESERVADO, ENTREGADO o CANCELADO, aceptar o editar sin ser el dueño, aceptar una segunda solicitud, cancelar una solicitud ya aceptada, confirmar la entrega sin ser el dueño, datos incompletos o inválidos y recursos inexistentes.

Resultado: 3 de 3 pruebas OK (todas las aserciones de arriba).

**Manuales:**
- El flujo completo desde la interfaz, iniciando sesión con distintos usuarios: benja y carla solicitan, ana acepta (la publicación queda RESERVADA y la otra solicitud RECHAZADA) y confirma la entrega (la publicación queda ENTREGADA).
- Los datos siguen guardados al reiniciar la API, porque viven en SQL Server.

## Declaración de uso de inteligencia artificial

- **Herramienta:** Claude Code.
- **Para qué:** generar el código del proyecto.
- **Qué hice yo:** revisé el código generado y lo modifiqué, porque no tenía la estructura que yo quería.
- **Cómo verifiqué:** probé que funcionara creando varias solicitudes sobre una misma publicación (una calculadora) para ver qué pasaba con cada una.
