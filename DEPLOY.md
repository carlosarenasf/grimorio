# Desplegar Grimorio (gratis, con persistencia)

Tres piezas:

1. **Base de datos** → **Neon** (Postgres serverless, plan gratis **permanente**).
2. **Backend** (Fastify + WebSocket, Docker) → **Render** Web Service (free).
3. **Frontend** (Vite/React, estático) → **Render** Static Site (free).

> Por qué Neon y no el Postgres de Render: el Postgres gratis de Render **se borra a los
> 30 días**. Neon free es persistente, así que las cuentas y partidas sobreviven entre sesiones.

El backend **duerme** tras ~15 min sin tráfico (free de Render). La primera petición tras
dormir tarda ~30–60 s en despertar; mientras haya gente jugando (peticiones + WebSocket
abierto) se mantiene despierto toda la partida.

---

## 1) Base de datos — Neon

1. Crea cuenta en https://neon.tech (gratis).
2. **New Project** → nómbralo `grimorio`. Región cercana (p. ej. Europe).
3. En el dashboard del proyecto, copia la **Connection string** (usa la **pooled**).
   Tiene esta forma:
   ```
   postgresql://USER:PASSWORD@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Asegúrate de que termina en `?sslmode=require`. Guárdala: es tu `DATABASE_URL`.

No hay que crear tablas a mano: el backend ejecuta las migraciones solo al arrancar.

---

## 2) Backend — Render Web Service (Docker)

1. Crea cuenta en https://render.com y conéctala a tu GitHub (`carlosarenasf/grimorio`).
2. **New + → Web Service** → elige el repo `grimorio`.
3. Configuración:
   - **Name**: `grimorio-backend`  → la URL será `https://grimorio-backend.onrender.com`
   - **Language/Runtime**: **Docker**
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Build Context Directory**: `.` (la raíz del repo)
   - **Instance Type**: **Free**
   - **Health Check Path**: `/health`
4. **Environment Variables** (Advanced → Add Environment Variable):

   | Key            | Value                                                        |
   |----------------|-------------------------------------------------------------|
   | `NODE_ENV`     | `production`                                                 |
   | `DATABASE_URL` | *(la connection string de Neon, con `?sslmode=require`)*     |
   | `SESSION_SECRET` | *(secreto largo aleatorio — genera con `openssl rand -hex 32`)* |
   | `CORS_ORIGIN`  | `https://grimorio-frontend.onrender.com`                     |

   > `CORS_ORIGIN` debe ser **exactamente** el origen del frontend (sin barra final).
   > Como en Render la URL es `<nombre>.onrender.com`, ya sabemos cuál será el frontend
   > (paso 3) y lo ponemos aquí desde ya.
   > No definas `PORT`: Render lo inyecta y el backend lo respeta.
   > `NODE_ENV=production` activa automáticamente la cookie `SameSite=None; Secure`
   > (necesaria porque frontend y backend están en dominios distintos).

5. **Create Web Service**. Espera a que el build (Docker) termine y veas “Live”.
   Comprueba: abre `https://grimorio-backend.onrender.com/health` → debe responder `ok`.

---

## 3) Frontend — Render Static Site

1. **New + → Static Site** → mismo repo `grimorio`.
2. Configuración:
   - **Name**: `grimorio-frontend`  → URL `https://grimorio-frontend.onrender.com`
     (debe coincidir con lo que pusiste en `CORS_ORIGIN`).
   - **Build Command**:
     ```
     corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile && pnpm -C frontend build
     ```
   - **Publish Directory**: `frontend/dist`
3. **Environment Variables**:

   | Key             | Value                                      |
   |-----------------|--------------------------------------------|
   | `VITE_API_URL`  | `https://grimorio-backend.onrender.com`    |

   > Vite incrusta esta variable **en el build**, así que si la cambias hay que
   > volver a desplegar. De aquí salen tanto las llamadas REST como el WebSocket
   > (`https` → `wss` automáticamente).

4. **Rewrite para SPA** (rutas como `/unirse/CODIGO` deben servir `index.html`):
   tras crear el sitio, ve a **Redirects/Rewrites → Add Rule**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: **Rewrite**

5. **Create Static Site** y espera a “Live”.

---

## 4) Probar

1. Abre `https://grimorio-frontend.onrender.com`.
2. Regístrate (la primera petición puede tardar si el backend estaba dormido).
3. Crea una campaña → invita (el enlace será `https://grimorio-frontend.onrender.com/unirse/CODIGO`).
4. Crea personaje, entra a la mesa, tira dados. Cierra y vuelve otro día: los datos siguen ahí (Neon).

---

## Referencia de variables de entorno

**Backend** (`grimorio-backend`):

| Variable        | Obligatoria | Para qué |
|-----------------|-------------|----------|
| `NODE_ENV`      | sí (`production`) | Activa cookie segura cross-site |
| `DATABASE_URL`  | sí          | Postgres de Neon (persistencia) |
| `SESSION_SECRET`| sí          | Firma de la sesión (no uses el por defecto) |
| `CORS_ORIGIN`   | sí          | Origen exacto del frontend |
| `COOKIE_SAMESITE` / `COOKIE_SECURE` | no | Override manual si algún día co-alojas front y back en el mismo dominio (`lax`/`false`) |

**Frontend** (`grimorio-frontend`):

| Variable       | Obligatoria | Para qué |
|----------------|-------------|----------|
| `VITE_API_URL` | sí          | URL del backend (REST + WebSocket) |

---

## Notas

- **Dominio propio** (opcional): si añades p. ej. `grimorio.app` (front) y `api.grimorio.app`
  (back) en Render, actualiza `CORS_ORIGIN` y `VITE_API_URL` a esos dominios y vuelve a
  desplegar el frontend. Con subdominios del mismo dominio podrías incluso usar
  `COOKIE_SAMESITE=lax`.
- **Despertar antes de la partida**: abre la web unos minutos antes para que el backend
  arranque y Neon despierte; así el primer jugador no se come la espera.
- **Actualizar**: cada `git push` a `main` redepliega automáticamente ambos servicios.
