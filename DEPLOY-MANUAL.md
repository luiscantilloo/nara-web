# nara-web → núcleo (PROGRAM_ID=nara)

Guía completa: `../nucleo-api/DEPLOY-MANUAL.md`.

1. Tener en Render el servicio **nucleo-nara** (`PROGRAM_ID=nara`) sano (`/api/health`).
2. En Vercel, env de `deploy/VERCEL-NARA.env.example` con esa URL.
3. Redeploy. No uses la URL del servicio Parienta.
4. Apaga `nara-api` solo cuando NARA prod esté estable contra el núcleo.
