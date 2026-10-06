# NARA (nara-web)

Frontend del programa de salud mental post-sismo (Eje Cafetero).  
Fuente de verdad de UX: mockup HTML interactivo. Solo frontend mock hasta que haya API.

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Dev server en **http://localhost:3002** (Turbopack) |
| `npm run dev:webpack` | Igual, con Webpack |
| `npm run build` | Build de producción |
| `npm run start` | Serve build en puerto 3002 |
| `npm run lint` | ESLint |

## Convención

- Rutas delgadas en `src/app/`
- Dominio del producto en `src/modules/`
- UI genérica en `src/components/`
- Paths y menús en `src/config/`
- Datos falsos en `src/data/mock/` + `src/services/mock/`

Detalle: `src/README.md`.

## Desarrollo por pasos

Plan de 18 pasos. No avanzar features sin el número de paso. Scaffold = paso 1.
