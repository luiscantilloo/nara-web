# Plan TRL 5.13 — dependencias high (nara-web)

Fecha: 2026-10-10

## Hecho

- **next** y **eslint-config-next** → **16.4.0** (fuera de 16.0.0–16.3.7).
- **xlsx** eliminado; scripts de Excel usan **exceljs@4.4.0**.

## Restantes (dev / transitive)

Si `npm audit` marca highs en `braces` / `micromatch` / `fast-glob` vía eslint: son **devDependencies**, no runtime. No bajar Next a 14.x. Re-auditar en cada bump de `eslint-config-next`.

## Seed de contraseñas (5.9 / 6.12)

Variables obligatorias en `.env.local` (sin default):

- `SEED_OBS_SALENTO_PASSWORD`
- `SEED_OBS_FINANCIADOR_PASSWORD`
- `SEED_OBS_INVESTIGACION_PASSWORD`
- `SEED_DEMO_PATIENT_PASSWORD`

En producción: rotar o desactivar esas cuentas demo.
