# Aviakassa Pro — Chiptalar va Moliyaviy Balans Tizimi

Aviakassa va chipta dilerlari uchun mo‘ljallangan zamonaviy, tezkor va ixcham hisob-kitob dasturi. Tizim blok/partiyalar bo‘yicha chiptalarni birinchi qo‘ldan sotib olish, sub-agentlarga yoki donalab chakana mijozlarga sotish, ombordagi qoldiq joylarni bilib turish hamda qarzdorlik/haqdorlikni doimiy nazorat qilish imkonini beradi.

---

## 🚀 Asosiy Imkoniyatlar

1. **Partiyalar (Blok chiptalar ombori):**
   * Ta’minotchidan birinchi qo‘l blok sotib olish (Yo‘nalish, reys, sana, nechta chipta, 1 ta chipta tannarxi).
   * Har bir partiyada **nechta chipta qolganini (qoldiq)** va qanchasi sotilganini vizual progress bar orqali ko‘rib turish.
   * Chipta qolmaganda avtomatik arxivga o‘tish yoki faol holatda saqlash.

2. **Tezkor Sotuv (Partiyadan chiqim):**
   * Qaysi partiyadan qancha sotilayotgani (sub-agentga ulgurji yoki yo‘lovchiga donalab).
   * Har bir sotuvda **Sof foyda** bir zumda avtomatik hisoblanadi: `(Sotish narxi - Tannarx) * Soni`.
   * Qisman yoki to‘liq naqd/karta to‘lovini shu zahoti kassa kirimiga yozish imkoniyati.

3. **Qarzdorlik va Haqdorlik (Balans):**
   * **Bizning haqimiz (Debitorlik):** Qaysi mijoz yoki sub-agent bizdan qancha qarzdor.
   * **Bizning qarzimiz (Kreditorlik):** Biz ta’minotchilarga qancha to‘lashimiz kerak.
   * **Akt Sverka:** Har bir hamkorning barcha partiyalari/sotuvlari va to‘lovlari tarixini alohida ko‘rish.

4. **Kassa & To‘lovlar:**
   * Mijozlardan to‘lov qabul qilish (Kirim — qarzni kamaytiradi).
   * Ta’minotchilarga to‘lov o‘tkazish (Chiqim — qarzimizni kamaytiradi).
   * To‘lov shakllari: Naqd pul, Karta / O‘tkazma, Bank hisobi.

5. **Texnologik Stack:**
   * **Next.js 16 (App Router, Server Actions, React 19)**
   * **Tailwind CSS 4**
   * **Drizzle ORM & SQLite / Cloudflare D1 / LibSQL**
   * **Lucide Icons**

---

## 💻 Mahalliy (Local) Ishga Tushirish

1. **Kutubxonalarni o‘rnatish:**
   ```bash
   npm install
   ```

2. **Namunaviy demo ma'lumotlarni yuklash (ixtiyoriy):**
   ```bash
   node scripts/seed.js
   ```

3. **Loyiha serverini ishga tushirish:**
   ```bash
   npm run dev
   ```
   Brauzerda [http://localhost:3000](http://localhost:3000) manziliga kiring.

4. **Build tekshiruvi:**
   ```bash
   npm run build
   ```

---

## ☁️ Cloudflare Pages / Workers ga Deploy Qilish

Loyiha Cloudflare OpenNext va Cloudflare D1 (serverless SQLite) uchun to‘liq moslashtirilgan.

### 1-usul: Cloudflare Dashboard (GitHub orqali avtomatik)
1. Ushbu loyihani GitHub omboringizga (repository) push qiling.
2. Cloudflare Dashboard-ga kiring: **Compute (Workers) -> Create application**.
3. GitHub omboringizni tanlang.
4. Build sozlamalari:
   * **Build command:** `npm run cloudflare:build`
   * **Output directory:** `.open-next/assets`
   * **Compatibility flag:** `nodejs_compat`
5. D1 ma'lumotlar bazasini ulash (Binding name: `DB`).

### 2-usul: Wrangler CLI orqali to'g'ridan-to'g'ri deploy
1. Cloudflare hisobingizga kiring:
   ```bash
   npx wrangler login
   ```
2. Yangi D1 ma'lumotlar bazasi yarating:
   ```bash
   npx wrangler d1 create aviakassa-db
   ```
   Natijada berilgan `database_id` ni `wrangler.jsonc` faylidagi `database_id` o‘rniga qo‘ying.
3. Deploy qiling:
   ```bash
   npm run cloudflare:deploy
   ```

---

## 📁 Loyiha Tuzilmasi

* `src/app/page.tsx` — Asosiy sahifa (ma'lumotlarni yuklash va AppContainer ga uzatish)
* `src/components/AppContainer.tsx` — Asosiy interaktiv boshqaruv ekrani
* `src/components/DashboardView.tsx` — 4 ta asosiy ko‘rsatkich, faol partiyalar vitrinasi va qoldiqlar
* `src/components/BatchesView.tsx` — Partiyalar ombori, qidiruv va filtrlar
* `src/components/PartnersView.tsx` — Mijozlar va ta'minotchilar qarzdorlik balansi
* `src/components/SalesView.tsx` — Chiptalar sotuvlar daftari va sof foyda hisobi
* `src/components/PaymentsView.tsx` — Kassa kirim/chiqim to‘lovlari
* `src/components/SaleModal.tsx` — Partiyadan chipta sotish formasi
* `src/components/BatchModal.tsx` — Yangi partiya sotib olish formasi
* `src/components/PaymentModal.tsx` — To‘lov kiritish (kirim/chiqim)
* `src/components/PartnerHistoryModal.tsx` — Sverka daftari
* `src/lib/schema.ts` — Drizzle ORM jadval sxemalari (SQLite / Cloudflare D1)
* `src/lib/actions.ts` — Server Actions (Hisob-kitoblar, qoldiqlar, sotuvlar, to‘lovlar)
* `src/lib/db.ts` — Universal ma'lumotlar bazasi mijozi (Local SQLite va Cloudflare D1)
* `wrangler.jsonc` — Cloudflare Pages/Workers konfiguratsiyasi
