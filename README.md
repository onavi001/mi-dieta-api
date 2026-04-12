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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

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

Nota: la logica exacta puede evolucionar por controlador, pero esos prefijos estan montados en `src/app.js`.

## Catalogo de comidas (Supabase)

El catalogo oficial se guarda en `public.meals` y se usa para generar y sugerir alternativas.

1. Aplica esquema de base:

```bash
# ejecutar en Supabase SQL Editor
supabase-schema.sql
```

2. Siembra catalogo curado:

```bash
npm run seed:meals
```

3. Verifica:

```bash
npm run verify:meals
```

4. Dry-run (sin escribir DB):

```bash
npm run seed:meals:dry
```

## Integracion con frontend

- El frontend debe apuntar a este backend via `VITE_DIETA_API_BASE`.
- `CLIENT_URL` debe coincidir con el origen del frontend para CORS.

## Deploy

Funciona bien en Render o Railway:

- Build: `npm install`
- Start: `npm start`
- Health path: `/health`