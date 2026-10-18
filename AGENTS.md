# AGENTS.md — aviakassa

> **Avval `PROJECT.md` ni o'qing.** Unda arxitektura, biznes qoidalari, API, testlar,
> deploy tartibi va ma'lum cheklovlar batafsil yozilgan. Bu fayl faqat qisqa
> eslatma va Next.js qoidalarini saqlaydi.

## Qisqa eslatma

- **Stack:** Next.js 15 (static export) + React 19 + Django 6.1/DRF + PostgreSQL 16 + nginx + Telegram bot.
- **Pul faqat `Decimal`** (`backend/core/money.py`); frontend pulni qayta hisoblamaydi.
- **Yagona manba — server:** `GET /api/data/snapshot/`; brauzerda biznes-ma'lumot nusxasi yo'q.
- **Testlar:** `npm test`, `npm run typecheck`, `npm run lint`; backendda `python manage.py test`,
  `python manage.py check_integrity`.
- **Migratsiya** yaratsangiz: `makemigrations --check`, prodda avval `pg_dump`.
- **Deploy:** `PROJECT.md` 10-bo'lim (git bundle → merge → migrate → backend/bot → frontend build → check_integrity).
- **Destruktiv buyruqlar:** `seed_demo_data`, `reset_production`, `clear_db.py`, `/api/data/reset/` — prodda ishlatmang.
- **README.md eskirgan** (localStorage/Cloudflare haqida) — haqiqiy holat `PROJECT.md`da.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
