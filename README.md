# mi-dieta-api

Backend REST para Mi Dieta usando Express y Supabase.

## Stack

- Node.js
- Express
- Supabase

## Variables de entorno

Basadas en `.env.example`:

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIENT_URL=http://localhost:5173
```

## Desarrollo local

```bash
npm install
npm run dev
```

Health check:

```bash
GET /health
```

## Deploy recomendado

La opcion mas simple para este backend es `Render` o `Railway`.

### Render

- Tipo: `Web Service`
- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

### Railway

- Detecta automaticamente `package.json`
- Start command: `npm start`
- Variables: las mismas del `.env.example`

## GitHub

Si el repo aun no existe:

```bash
git init
git add .
git commit -m "Initial backend commit"
```

Despues crea un repo vacio en GitHub y conecta el remoto:

```bash
git remote add origin <URL_DEL_REPO>
git branch -M main
git push -u origin main
```