# Aviakassa (5TOUR) — loyiha qo'llanmasi

> Bu fayl **AI agentlar va yangi dasturchilar** uchun. Loyihani davom ettirishdan oldin
> shu hujjatni to'liq o'qing. Kod haqidagi barcha qoidalar shu yerda izohlangan.
>
> Oxirgi yangilanish: **2026-10-19**, deploy qilingan commit: `303932c`.

---

## 1. Loyiha nima qiladi

Aviakassa — aviachiptalar bilan savdo qiluvchi kichik kompaniya uchun ichki hisob-kitob tizimi:

- ta'minotchidan **partiya (blok) chiptalar** sotib olish (borish yoki borish-qaytish);
- partiyadan **mijozlarga sotish** (sub-agentga ulgurji yoki donalab);
- **qoldiq** (borish/kelish alohida), **qarz/haq**, **kassa**, **sof foyda** hisobi;
- **avto-xarid**: jadval bo'yicha haftalik partiyalarni avtomatik yaratish va ularni
  keyin «hisobga qo'shish»;
- Telegram bot orqali muddati yaqin partiyalar haqida eslatma.

Tizim bitta kompaniya uchun, ko'p foydalanuvchili (hozir amalda bitta admin), **USD** da yuritiladi.

---

## 2. Arxitektura

```
Brauzer (React 19, Next.js 15 static export)
        │  /api/*  (same-origin)
        ▼
nginx (frontend konteyner, :80 → host :3002)
        │  proxy_pass backend:8000
        ▼
Django 6.1 + DRF + SimpleJWT  ──►  PostgreSQL 16 (:5433 faqat localhost)
        ▲
        │
Telegram bot (alohida konteyner, long polling)
```

- Frontend **statik eksport** (`output: "export"`) — `next build` → `out/` → nginx image ichida.
- Backend kod **bind-mount** (`./backend:/app`) — `git pull`dan keyin `restart` yetarli.
- DB — Docker volume `postgres_data`.
- Har bir so'rovda `ActiveDatabaseMiddleware` faol bazani aniqlaydi (ko'p-bazali rejim uchun).

### Repo tuzilishi

```
src/
  app/                 layout, page (butun ilova AppContainer ichida)
  components/          UI: AppContainer (state egasi), *View, *Modal
  lib/api.ts           barcha HTTP so'rovlar, token refresh, snapshot
  lib/storage.ts       tiplar + calculateEnrichedData (faqat ko'rsatish uchun)
  lib/format.ts        pul/sana formatlash, segment yordamchilari
  lib/auth.ts          login/logout, token saqlash
backend/
  core/                settings, urls, money.py, fields.py, data_views.py,
                       db_router.py, db_middleware.py, db_state.py, pagination.py
  apps/partners/       Partner modeli, balans hisobi
  apps/flights/        Batch, BatchCategory, avto-xarid, kategoriya API
  apps/sales/          Sale, segment, qoldiq harakati
  apps/cash/           Payment, DebtOffset, CashAccount
  apps/control/        ko'p-bazali rejim + check_integrity buyrug'i
  apps/telegram_bot/   bot xizmatlari va management command
  scripts/             verify_prod_fixture.py (prod nusxasida e2e)
public/                PWA manifest, sw.js, brend rasmlari
nginx.conf             frontend konteyner konfiguratsiyasi
docker-compose.yml     db + backend + bot + frontend
README.md              ESKI (localStorage/Cloudflare haqida) — ishonmang
```

---

## 3. Muhit o'zgaruvchilari (`.env`, serverda)

| Kalit | Izoh |
|---|---|
| `DEBUG` | Prodda `False` |
| `SECRET_KEY` | Majburiy, ≥50 belgi |
| `ALLOWED_HOSTS` | IP + `localhost,127.0.0.1,backend` |
| `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS` | Frontend manzili |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Postgres |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_EXPIRING_DAYS`, `TELEGRAM_ALLOWED_CHAT_IDS` | Bot |

Namuna: `.env.example`. `.env` gitga tushmaydi, serverda `chmod 600`.

---

## 4. Ma'lumot modeli

### Partner
`name`, `type` (`SUPPLIER`/`CLIENT`/`BOTH`), `tags` (JSON), `phone`, `notes`.
Balans **hisoblanadi** (`compute_financials`), saqlanmaydi:

```
client_debt   = Σ sotuv summasi − Σ mijoz to'lovlari (INCOME)
supplier_debt = Σ hisobga olingan partiya tannarxi − Σ bizning to'lovlar (EXPENSE)
balance       = supplier_debt − client_debt + Σ offset_from − Σ offset_to
```
Manfiy balans = «ular bizga qarzdor», musbat = «bizda haqlari bor».

### Batch (partiya)
`batch_number` (avto `P00001`), `route`, `flight_date`, `flight_number`, `departure_time`,
`arrival_time`, `is_round_trip`, `return_date`, `return_flight_number`, `return_*_time`,
`purchase_date`, `baggage`, `supplier`, `total_qty`, `remaining_qty`,
`return_remaining_qty`, `buy_price`, `total_cost`, `status`, `notes`, `created_at` +

**Yangi maydonlar (avto-xarid):**
- `category` → `BatchCategory` («1 oylik», «Yillik», «Namangan» …)
- `is_auto` — jadval bo'yicha yaratilgan
- `accounted_at` — hamkor qarziga qo'shilgan vaqt; **`NULL` = hisobga olinmagan**
- `series_id` — bitta avto-jadval partiyalarini bog'laydi
- `return_gap_days` — uchish va qaytish orasidagi kunlar (masalan 13)

Qoidalar:
- `total_qty` kamida 1; `remaining_qty ≤ total_qty` (DB constraint).
- `status` faqat `save()` ichida qayta hisoblanadi: ikkala pool ham 0 bo'lsa `COMPLETED`.
- Qo'lda yaratilgan partiya `accounted_at = now` bilan darhol hisobga olinadi.
- Reys maydonlari o'zgarsa, partiyadagi barcha sotuvlarga sinxronlanadi.

### BatchCategory
`name` (unique). CRUD: `/api/categories/`. Snapshot'da `categories` bilan qaytadi.

### Sale
`batch`, `client`, `qty`, `buy_price`, `sell_price`, `total_amount`, `profit`,
`segment` (`OUTBOUND`/`RETURN`/`BOTH`, oddiy partiyada `""`), `sale_date`,
reys maydonlari (denormalizatsiya), `passenger_names`, `notes`, `created_at`.

- `total_amount = sell_price × qty`, `profit = total_amount − buy_price × qty`
  — **faqat `Decimal`**, `core/money.py` orqali.
- Qoldiq `select_for_update` bilan kamayadi; ortiqcha sotishga yo'l qo'yilmaydi.
- O'chirilganda o'rinlar partiyaga qaytadi.

### Payment / DebtOffset / CashAccount
- `Payment`: `partner`, `type` (`INCOME`/`EXPENSE`), `amount > 0`, `payment_date`,
  `payment_method`, `account`.
- `DebtOffset`: `from_partner ≠ to_partner`, `amount > 0`.
- `CashAccount`: `name` unique.

### DatabaseRegistry (control)
Har bir qo'shimcha baza uchun yozuv. Bir vaqtda **faqat bitta faol** (partial unique constraint).
Barcha biznes modellari router orqali faol bazaga yo'naltiriladi.

---

## 5. Biznes qoidalari — bu qismni buzmaslik kerak

### 5.1 Pul
- Hisob faqat `Decimal`; float faqat JSON chegarasida.
- `core/money.py`: `to_money()` (2 xona, ROUND_HALF_UP), `money_sum()`, `as_number()`.
- Serializerlarda `MoneyField` (`core/fields.py`) — float shovqinini 2 xonaga keltiradi.
- `REST_FRAMEWORK["COERCE_DECIMAL_TO_STRING"] = False` → API'da pul **son** bo'lib qaytadi.
- Frontend **pulni qayta hisoblamaydi**: server nima yuborsa, shuni ko'rsatadi
  (`calculateEnrichedData` faqat nom/yo'nalish kabi ko'rsatish maydonlarini qo'shadi).

### 5.2 Yagona haqiqat manbasi
- Ma'lumot faqat serverda. Brauzerda biznes-ma'lumot nusxasi **saqlanmaydi**.
- Yuklash: `GET /api/data/snapshot/` — bitta so'rovda hamma kolleksiya.
- Aloqa uzilsa UI qizil ogohlantirish va «Qayta urinish» ko'rsatadi; eski ma'lumot
  «hozirgi» deb ko'rsatilmaydi.

### 5.3 Sotuv va qoldiq
- Borish-qaytish partiyasida **ikki pool**: `remaining_qty` (borish) va
  `return_remaining_qty` (kelish). `segment` qaysi pool(lar)dan ayirishni belgilaydi:
  `OUTBOUND` → faqat borish, `RETURN` → faqat kelish, `BOTH` → ikkalasi.
- Uchish yoki qaytish sanasi o'tgan bo'lsa, o'sha segmentni sotish taqiqlanadi
  (serializer + UI `disabled`).
- Sotuv sanasi kelajakda bo'lishi mumkin emas.
- Qoldiq harakati `Sale.save()/delete()` ichida, faol baza tranzaksiyasida.

### 5.4 Avto-xarid (C variant)
- Kirish: bitta partiya parametrlari + `until` (tugash sanasi).
- Server `flightDate`dan boshlab **har 7 kunda** partiya yaratadi; qaytish =
  `flight_date + return_gap_days`; narx/son/reys/vaqt/bagaj **bir xil**.
- Maksimal 60 ta; bir xil `flight_number` + `flight_date` mavjud bo'lsa o'sha sana
  **o'tkazib yuboriladi** (`skipped`).
- Yaratilganlar: `is_auto=True`, `accounted_at=None`, bitta `series_id`.
- **Hisobga olinmaguncha hamkor balansida ko'rinmaydi** (`compute_financials` filtri).
- `POST /api/batches/{id}/account/` — bittasini; `POST /api/batches/account-all/`
  `{seriesId}` yoki `{ids}` — ko'pini hisobga oladi.
- Vaqtni tahrirlashda `propagateToFuture: true` → shu seriyadagi **keyingi**
  (`flight_date >=`) partiyalarga tarqaladi; oldingilari tegilmaydi.

### 5.5 «Yana qo'shish»
Mavjud partiya ma'lumotlari bilan forma oldindan to'ladi; foydalanuvchi sana/son/narx
kiritadi; qaytish `sana + return_gap_days`. Hamkor bo'sh qolsa — avvalgi ta'minotchi.

### 5.6 Ko'p-bazali rejim
- `ActiveDatabaseMiddleware` → `resolve_active_alias()` → contextvar.
- Router biznes modellarni (`partners`, `flights`, `sales`, `cash`) faol bazaga yuboradi.
- **Kesh yo'q**: har so'rovda `DatabaseRegistry`dan bitta so'rov (workerlar orasida
  nomuvofiqlik bo'lmasligi uchun).
- Bot `active_database()` kontekstida ishlaydi (HTTP middleware yo'q).
- Yangi baza yaratish: `CREATE DATABASE` + `migrate` + tanlangan kategoriyalarni ko'chirish;
  xato bo'lsa yarim tayyor baza o'chiriladi.
- Faol baza asosiydan farq qilsa, UI sariq banner bilan ogohlantiradi (snapshotdagi
  `activeDatabase.isBase` asosida) — tasodifan boshqa bazada ishlab ketish oldini oladi.

### 5.7 Sanalar
- Frontend: `getTodayISO()` (mahalliy) — `toISOString()` **ishlatilmaydi** (UTC siljishi).
- Backend: `timezone.localdate()`, `TIME_ZONE="Asia/Tashkent"`.

---

## 6. API (asosiy)

| Metod | Yo'l | Izoh |
|---|---|---|
| POST | `/api/auth/login/` | JWT (throttle 10/min) |
| POST | `/api/auth/refresh/`, `/api/auth/logout/` | token rotatsiyasi / blacklist |
| GET | `/api/health/` | ochiq |
| GET | `/api/data/snapshot/` | hamma ma'lumot + `categories` + `activeDatabase` (`name/dbName/isBase`) |
| POST | `/api/data/import/` | faqat admin; avval validatsiya, xato bo'lsa hech narsa o'chirilmaydi |
| POST | `/api/data/reset/` | faqat admin, **destruktiv** — `{"confirm": "TOZALASH"}`siz ishlamaydi |
| CRUD | `/api/partners/`, `/api/sales/`, `/api/cash/payments/`, `/api/cash/offsets/`, `/api/cash/accounts/` | |
| CRUD | `/api/batches/` | filtrlar: `status`, `category`, `accounted=pending/done`, `auto=1/0` |
| POST | `/api/batches/bulk/` | bir nechta partiya + ixtiyoriy to'lov |
| POST | `/api/batches/auto/` | haftalik avto-jarayon |
| POST | `/api/batches/{id}/account/` | bittasini hisobga olish |
| POST | `/api/batches/account-all/` | seriya/ids bo'yicha |
| CRUD | `/api/categories/` | xarid turlari |
| CRUD | `/api/databases/` + `activate/`, `close/` | faqat admin |

Pagination: `core/pagination.AviakassaPagination`, `?page_size=` (max 5000).

---

## 7. Frontend qoidalari

- Butun holat `AppContainer.tsx`da (bitta katta komponent, ~1300 qator). Yangi global
  holat qo'shsangiz — shu yerda.
- Har bir mutatsiyadan keyin `syncFromServer()` — bitta snapshot so'rovi.
- `src/lib/api.ts` — barcha endpointlar, `ApiError` (maydon xatolari), token refresh.
- `src/lib/storage.ts` — **faqat tiplar va ko'rsatish uchun** boyitish; biznes hisob yo'q.
- Modallar: `Modal.tsx` (fokus tuzog'i, Escape), `ConfirmDialog.tsx` (o'chirishdan oldin).
- Og'ir ro'yxatlar `useMemo` bilan; qidiruv/filtr o'zgargandagina qayta hisoblanadi.
- Pul: `formatUSD`/`formatMoney` — sentlarni saqlaydi.
- Stil: Tailwind v4, dark mode `dark:` klasslari, `lucide-react` ikonkalar.

---

## 8. Testlar va tekshiruv

```bash
# Frontend
npm test            # 21 ta biznes-mantiq testi (node --experimental-strip-types)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (backend/.vendor/.tmp ignore qilingan)

# Backend
cd backend
DEBUG=True SECRET_KEY=x python manage.py test          # 124 ta test
DEBUG=True SECRET_KEY=x python manage.py check         # konfiguratsiya
DEBUG=True SECRET_KEY=x python manage.py makemigrations --check --dry-run

# Ma'lumot butunligi (prodda ham ishlatiladi)
python manage.py check_integrity
```

`check_integrity` tekshiradi: qoldiq = jami − sotilgan (ikkala pool), tannarx,
sotuv summasi/foydasi, reys sinxronligi, segment, hamkor balansi, faol baza yagonaligi.
Xato topsa **1 kod** bilan chiqadi — deploydan keyin albatta ishga tushiring.

Standart rejimda **faol baza** (HTTP so'rovlarga xizmat qilayotgani) tekshiriladi.
Qo'shimcha: `--database <alias>` — aniq baza; `--all` — asosiy baza + ro'yxatdagi
barcha bazalar (ko'p-bazali rejimda deploy tekshiruvi uchun ayniqsa muhim).

Prod nusxasida to'liq e2e (sqlite'da):

```bash
# serverda: dumpdata → scp → lokal
cd backend
python scripts/verify_prod_fixture.py ../_prod_fixture.json
```
Skript snapshot, sotuv yaratish/o'zgartirish/o'chirish, avto-xarid va hisobga olishni
haqiqiy prod ma'lumoti nusxasida tekshiradi.

---

## 9. Lokal ishga tushirish

```bash
npm install
npm run dev                 # http://localhost:3000

cd backend
python -m pip install -r requirements.txt
DEBUG=True SECRET_KEY=dev python manage.py migrate
DEBUG=True SECRET_KEY=dev python manage.py runserver 8000
```

`DB_ENGINE` ko'rsatilmasa SQLite (`backend/db.sqlite3`) ishlatiladi — lokal uchun qulay.
Frontend `/api` ga same-origin murojaat qiladi; lokalda `next.config` proxy yo'q, shuning uchun
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api` bilan ishlatish mumkin.

Admin yaratish: `python manage.py create_admin` (`DJANGO_ADMIN_PASSWORD` bilan).

---

## 10. Deploy (production)

**Server:** `donxolm` (ssh config), `185.241.151.30`, `/opt/aviakassa`, Docker Compose loyihasi `aviakassa`.
**Portlar:** frontend `0.0.0.0:3002`, backend `127.0.0.1:8000`, Postgres `127.0.0.1:5433`.
**Domen/HTTPS hozircha yo'q** (IP orqali ishlaydi).

### Tartib

```bash
# 1) Lokalda: testlar yashil bo'lsin
npm test && npm run typecheck && npm run lint
cd backend && python manage.py test && python manage.py check_integrity

# 2) Commit + bundle
git add -A && git commit -m "..."
git bundle create _deploy.bundle <serverdagi_commit>..main

# 3) Backup (serverda)
ssh donxolm 'cd /opt/aviakassa && docker exec aviakassa_db pg_dump -U aviakassa_user -d aviakassa_db | gzip > /root/aviakassa_backups/db_before_$(date +%Y%m%d_%H%M).sql.gz'

# 4) Kodni chiqarish
scp _deploy.bundle donxolm:/root/_deploy.bundle
ssh donxolm 'cd /opt/aviakassa && git fetch /root/_deploy.bundle main:deploy && git merge --ff-only deploy'

# 5) Migratsiyalar (ishlayotgan konteynerga tegmasdan)
ssh donxolm 'cd /opt/aviakassa && docker compose run --rm --no-deps backend python manage.py migrate --noinput'

# 6) Backend + bot
ssh donxolm 'cd /opt/aviakassa && docker compose up -d --no-deps --force-recreate backend && docker compose restart bot'

# 7) Frontend (statik eksport image ichida)
ssh donxolm 'cd /opt/aviakassa && docker compose build frontend && docker compose up -d --no-deps --force-recreate frontend'

# 8) Tekshirish
ssh donxolm 'cd /opt/aviakassa && docker compose ps && curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3002/api/health/ && docker compose exec -T backend python manage.py check_integrity'
```

Faqat frontend o'zgargan bo'lsa — 5–6 qadamlar kerak emas, faqat 7–8.
Faqat backend o'zgargan bo'lsa — 7 qadam kerak emas.

### Rollback

```bash
cd /opt/aviakassa
git reset --hard <oldingi_commit>
docker compose up -d --build frontend
docker compose restart backend bot
gunzip -c /root/aviakassa_backups/<backup>.sql.gz | docker exec -i aviakassa_db psql -U aviakassa_user -d aviakassa_db
```
Diqqat: migratsiyalar bazada qo'llangan bo'lsa, `reset --hard`dan keyin eski kod yangi
sxema bilan ishlashi mumkin — bunday holatda bazani ham backup'dan tiklang.

### Backup
- Har kuni **03:30** da `/opt/aviakassa/backup.sh` → `/root/aviakassa_backups/db_*.sql.gz`
  (14 kun saqlanadi). `backup.sh` serverda, **gitda emas**. Faqat `aviakassa_db`ni oladi!
- Ko'p-bazali rejimda qo'shimcha bazalar ham kerak — gitdagi buyruq:
  `python manage.py backup_databases --outdir <papka>` har bir bazani
  `<db_name>_<sana>.json.gz` qilib saqlaydi (tiklanishi: `loaddata --database=<alias>`).
- Deploy oldidan qo'lda backup olinadi (`db_before_*`).
- Off-site nusxa **yo'q** — muhim ma'lumot bo'lsa, tashqi joyga ko'chirish tavsiya etiladi.

---

## 11. Ma'lum cheklovlar / keyingi ishlar

1. **HTTPS/domen yo'q** — sayt va admin `http://IP:3002` da ochiq. Birinchi navbatdagi xavf.
2. **Rollar/audit yo'q** — har qanday authenticated foydalanuvchi o'chira oladi, iz qolmaydi.
3. **Monitoring yo'q** — faqat `docker compose logs`; xatolar haqida ogohlantirish yo'q.
4. **CI yo'q** — testlar qo'lda ishga tushiriladi.
5. **Vaqtni tarqatish UI'da yo'q** — hozircha faqat API (`propagateToFuture`).
6. **Ko'p-bazali rejim endi prodda ishlatilmoqda** — sinovdan keyin ham ehtiyotkor bo'ling:
   faol baza asosiydan farq qilsa UI sariq banner bilan ogohlantiradi; `check_integrity --all`
   va `backup_databases` barcha bazalarni qamrab oladi.
7. **Bitta valyuta (USD)** — `NAQD_UZS` kabi eski choice'lar kodda qolgan, lekin UI'da yo'q.
8. **`README.md` eskirgan** — localStorage/Cloudflare haqida yozilgan; haqiqiy holat shu faylda.

---

## 12. O'zgartirishdan oldin checklist

- [ ] Pulga tegadigan bo'lsangiz — faqat `Decimal`/`to_money`, test yozing.
- [ ] Migratsiya yaratsangiz — `makemigrations --check` va prodda backup.
- [ ] Biznes qoidasi o'zgarsa — `check_integrity` va testlarni yangilang.
- [ ] Frontendda pulni qayta hisoblamang — server qiymatini ishlating.
- [ ] Yangi endpoint — `snapshot`ga qo'shish kerakmi, o'ylang.
- [ ] Deploydan keyin: health, `check_integrity`, 5xx loglar.
- [ ] `backend/db.sqlite3`, `.env`, `_prod_fixture.json`, `staticfiles/` — commit qilinmaydi.

---

## 13. Muhim gotcha'lar

- **`AGENTS.md`** — `next dev` har ishga tushganda o'z blokini qayta yozadi; uni o'chirmang.
- **`README.md`** — eski, ishonmang (yuqorida aytilgan).
- **Windows CRLF** — repo LF, lokal Windows CRLF ogohlantirishi normal.
- **`test-business-logic.ts`** — `tsconfig`dan chiqarilgan, alohida `npm test` bilan ishlaydi.
- **ESLint** `backend/`, `.vendor/`, `.tmp/` ni tekshirmaydi.
- **`seed_demo_data` / `reset_production` / `clear_db.py`** — **destruktiv**, prodda ishlatmang.
- **`/api/data/reset/`** — admin token bilan istalgan payt hammasini o'chirishi mumkin.
- **Telegram bot** — faol bazani o'zi aniqlaydi; guruhga faqat bot admin bo'lgan guruhlarga yuboradi.
- **`fast-flights`** — sinab ko'rilgan, loyihaga **qo'shilmagan**: Google Flights'da charter
  reyslar yo'q va reys raqamini qaytarmaydi. Jadval uchun C variant (qo'lda + avto-generatsiya) tanlangan.

---

## 14. Qarorlar tarixi (commitlar)

| Commit | Nima qilindi |
|---|---|
| `2172423` | Pul Decimal'ga o'tdi; sana xatosi; ko'p-bazali tranzaksiya; snapshot; `check_integrity` |
| `8686f40` | Avto-xarid, hisobga olish, kategoriya, «Yana qo'shish» |
| `c6426a7` | Ombor sotuv filtri, desktop hisobga olish amallari |
| `fe02f08` | «Yana qo'shish» tugmasi karta ichiga «+» ko'rinishida |

Savol bo'lsa: avval testlarni ishga tushiring, `check_integrity`ni ko'ring, keyin shu hujjatni
yangilang — keyingi agent shunga tayanadi.
