# Evidencia T2 · Prueba respaldo «3 + 1»

**Fecha:** 2026-10-11  
**Modo:** laboratorio sintético local (sin acceso a la máquina de respaldos / sin datos reales).

## Resultado

| Paso | Estado |
|------|--------|
| 1. Respaldo con `mongodump` de base sintética `nara_trl` | **Hecho** — 2026-10-11 23:42:49–50 -05 |
| 2. Crear 3 `TRL-QA-R06-*` + archivar 1 (`syn-1`) | **Hecho** (en base viva) |
| 3. Restaurar en `nara_trl_restore_verif` y medir tiempo | **Hecho** — &lt; 1 s (13 docs) |
| 4. Verificar 3 checks | **A sí · B sí · C sí** |
| 5. Limpiar base restaurada | **Hecho** (`dropDatabase`) |
| 6. Base local de laboratorio | `nara_trl` puede quedarse o borrarse; no contiene PII real |

## Checks

- **A:** las 3 `TRL-QA-R06-*` no existen en la restaurada (count=0).
- **B:** `syn-1` aparece `Activo` (como al momento del respaldo).
- **C:** conteos people/patients/accounts/territories = 8/3/1/1.

## Comando de restauración validado

```bash
mongorestore --db=nara_trl_restore_verif --drop <DUMP_DIR>/nara_trl
```

Detalle completo en el paquete de evidencia PROD: `P7_docs/t2-respaldo-3mas1-SINTETICO.md`.
