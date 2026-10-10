# NARA (nara-web)

Frontend del programa de salud mental post-sismo (Eje Cafetero).  
Frontend Next.js. El backend es [nara-api](https://github.com/luiscantilloo/nara-api) (NestJS): todas las rutas `/api/*` se reescriben hacia él.

## Instalación desde cero

1. Requisitos: Node.js 24 y una base MongoDB (local o Atlas). Primero levante **nara-api** (vea su README) en `http://127.0.0.1:4000`.
2. `npm ci`
3. Copie `.env.example` a `.env.local` y complete las variables. **`NARA_API_URL` es obligatoria y se lee al compilar**: sin ella, `/api/*` no tiene backend.
4. Desarrollo: `npm run dev` → http://localhost:3002. Producción: `npm run build` y `npm run start`.
5. Pruebas: `npm test`.
6. Cuenta inicial de administrador (solo si la base está vacía): `SEED_ADMIN_PASSWORD=<clave de 12+ caracteres> npm run db:seed-admin`.

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Dev server en **http://localhost:3002** (Turbopack) |
| `npm run dev:webpack` | Igual, con Webpack |
| `npm run build` | Build de producción |
| `npm run start` | Serve build en puerto 3002 |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias de las reglas clínicas (`node --test`) |

## Convención

- Rutas delgadas en `src/app/`
- Dominio del producto en `src/modules/`
- UI genérica en `src/components/`
- Paths y menús en `src/config/`
- Datos falsos en `src/data/mock/` + `src/services/mock/`

Detalle: `src/README.md`.

## Desarrollo por pasos

Plan de 18 pasos. No avanzar features sin el número de paso. Scaffold = paso 1.
