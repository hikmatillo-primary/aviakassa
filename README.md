# Aviakassa Pro — Chiptalar va Moliyaviy Balans Tizimi

> ⚠️ **Bu hujjat eskirgan.** Quyida "localStorage / statik / Cloudflare" haqida yozilgan —
> amalda loyiha Django + PostgreSQL + JWT + Docker bilan ishlaydi.
> Haqiqiy arxitektura, qoidalar va deploy tartibi uchun [`PROJECT.md`](./PROJECT.md) ni o'qing.

Aviakassa va chipta dilerlari uchun mo‘ljallangan zamonaviy, tezkor, xavfsiz va server talab qilmaydigan (statik) hisob-kitob dasturi. Tizim blok/partiyalar bo‘yicha chiptalarni birinchi qo‘ldan sotib olish, sub-agentlarga yoki donalab chakana mijozlarga sotish, ombordagi qoldiq joylarni bilib turish hamda qarzdorlik/haqdorlikni doimiy nazorat qilish imkonini beradi.

Ma'lumotlar to‘liq brauzer xotirasida (`localStorage`) xavfsiz saqlanadi hamda **JSON orqali zaxira nusxa olish (Export)** va **qayta tiklash (Import)** imkoniyati mavjud.

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

5. **Zaxira Nusxa (Offline-First / Ma'lumotlar xavfsizligi):**
   * Ma'lumotlarni istalgan payt 1 tugma bilan kompyuterga fayl sifatida yuklab olish (`.json`).
   * Zaxira faylni boshqa brauzer yoki kompyuterda bir zumda tiklash (Import).

---

## ☁️ Cloudflare Pages ga Deploy Qilish

Loyiha to‘liq statik HTML/JS/CSS ko‘rinishida eksport qilinadi (`output: "export"`). Hech qanday tashqi ma'lumotlar bazasi yoki murakkab server talab qilinmaydi.

### Cloudflare Pages Dashboard orqali sozlash:
1. GitHub omboringizni Cloudflare Pages-ga ulang.
2. Build sozlamalarini quyidagicha kiriting:
   * **Framework preset:** `Next.js (Static HTML Export)` yoki `None`
   * **Build command:** `npm run build`
   * **Build output directory:** `out`
   * **Root directory:** `/` (bo‘sh qoldiring)
3. **Save and Deploy** tugmasini bosing. 
Deploy 1-2 daqiqada 100% muvaffaqiyatli yakunlanadi.

---

## 💻 Mahalliy (Local) Ishga Tushirish

1. **Kutubxonalarni o‘rnatish:**
   ```bash
   npm install
   ```

2. **Dasturni ishga tushirish:**
   ```bash
   npm run dev
   ```
   Brauzerda [http://localhost:3000](http://localhost:3000) manziliga kiring.

3. **Statik eksportni yig‘ish (Build):**
   ```bash
   npm run build
   ```
   Barcha statik fayllar `out/` papkasida hosil bo‘ladi.
