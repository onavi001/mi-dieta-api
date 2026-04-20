# mi-dieta-api

Backend REST para Mi Dieta (Express + Supabase).

## Stack

- Node.js
- Express 5
- Supabase
- CORS + Helmet

## Variables de entorno

```env
PORT=3000
CLIENT_URL=http://localhost:5173
# Opcional: varios orígenes (coma o espacio), p. ej. preview Netlify + producción
# CLIENT_URLS=https://mi-dieta.netlify.app,https://deploy-preview-xxx--mi-dieta.netlify.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# En PaaS detrás de proxy inverso (Render, Railway, Fly): IP real para rate limit
# TRUST_PROXY=1

# Opcional — logs
LOG_LEVEL=info

# Opcional — Sentry (errores del servidor)
# SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxx
# SENTRY_ENVIRONMENT=production
# SENTRY_TRACES_SAMPLE_RATE=0
```

- **`CLIENT_URL`**: origen principal del frontend. **`CLIENT_URLS`** (opcional): lista de orígenes adicionales permitidos por CORS (credenciales); útil para previews de Netlify o varios dominios.
- **`TRUST_PROXY`**: pon `1` en producción si el Node va detrás de un proxy que añade `X-Forwarded-*`; así `req.ip` y el rate limiting usan la IP del cliente.
- **`RATE_LIMIT_DISABLED`**: `1` solo para depuración local; desactiva límites en rutas de auth.
- **`LOG_LEVEL`**: nivel de [Pino](https://github.com/pinojs/pino) (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). Por defecto `info` en producción y `debug` en desarrollo.
- **`SENTRY_DSN`**: si está definido, se capturan excepciones no controladas y se envían a Sentry; además los errores siguen registrándose en logs (stdout).

## Seguridad (auth)

- **Rate limiting** en `POST /api/auth/login`, `/register` y `/refresh` (límites distintos; configurables con `AUTH_RATE_*` en `.env.example`).
- **CORS** solo para orígenes listados en `CLIENT_URL` / `CLIENT_URLS`.

## Logs

- Cada petición HTTP genera una línea JSON en **stdout** (visible en Render, Railway, etc.), excepto `GET /health` (ruido reducido).
- Contraseñas y cabeceras sensibles se **redactan** en los logs cuando la ruta lo permite.

## Apagado

- El proceso escucha **SIGTERM** / **SIGINT** y cierra el servidor HTTP antes de salir (útil en despliegues con rolling restart).

## Desarrollo local

```bash
npm install
npm run dev
```

Servidor por defecto: `http://localhost:3000`.

Health check:

```http
GET /health
```

## Scripts

```bash
npm run dev
npm start
npm run check-syntax
npm run seed:meals
npm run seed:meals:dry
npm run verify:meals
```

## Rutas principales

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users/me`
- `GET /api/meals`
- `GET /api/meals/:id`
- `GET /api/plans/my`
- `POST /api/plans/my/generate`
- `POST /api/plans/my/alternatives`
- `PATCH /api/plans/my/slot/:slotId`
- `POST /api/shares/*`
- `GET /api/nutrition/*`
- `POST /api/nutrition/*`

La lógica exacta vive en los controladores bajo `src/`; el montaje de rutas está en `src/app.js`.

## Reparto de porciones (generación de plan)

La generación semanal usa **`src/utils/mealPortionTargets.js`**: reparto de porciones por grupo y por tipo de comida alineado con el frontend (`professionalNutritionRules.ts` / `portionTargetEngine.ts` en **mi-dieta**). Si cambias matrices o pesos por objetivo, actualiza **ambos** lados para no desincronizar API y app.

## Catálogo de comidas (Supabase)

El catálogo oficial vive en `public.meals` y se usa para generar y sugerir alternativas.

1. Aplica el esquema en Supabase (SQL Editor):

```bash
# referencia en repo
supabase-schema.sql
```

2. Siembra el catálogo curado:

```bash
npm run seed:meals
```

3. Verifica:

```bash
npm run verify:meals
```

4. Dry-run (sin escribir en la DB):

```bash
npm run seed:meals:dry
```

## Integración con el frontend

- El frontend apunta a este backend con `VITE_DIETA_API_BASE`.
- CORS debe permitir el origen del front (`CLIENT_URL` u orígenes de producción).

## Deploy

Encaja bien en Render, Railway, Fly.io u otro PaaS:

- **Build**: `npm install`
- **Start**: `npm start`
- **Health**: `GET /health`

Configura `PORT`, todas las variables de Supabase, `CLIENT_URL` (+ `CLIENT_URLS` si usas previews u otros dominios) y **`TRUST_PROXY=1`** si el servicio va detrás de un proxy.

---

## Checklist breve para producción

- Variables de entorno solo en el hosting, no en el repositorio.
- `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor; nunca en el cliente.
- CORS acotado a dominios reales del frontend (`CLIENT_URL` + `CLIENT_URLS` si hace falta).
- `TRUST_PROXY=1` si el API está detrás de un reverse proxy.
- HTTPS en API y front; revisar políticas RLS en Supabase.
- Monitorización de errores y logs; reinicio automático del proceso (PM2, systemd o el que ofrezca el PaaS).
- Workflow **CI** en `.github/workflows/ci.yml` (`npm ci` + `npm run check-syntax`).

Detalles más amplios (privacidad, CI, legal): ver README del repo **mi-dieta** (sección “Hacia producción”).
