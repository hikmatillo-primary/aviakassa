/**
 * Raqamlarni barcha qurilmalarda (mobil va desktop) bir xil va aniq vergul bilan formatlash.
 * Telefon tilidan (uz, ru va h.k.) qat'i nazar doim 3 xonadan keyin vergul (,) qo'yiladi.
 */
export function formatMoney(amount: number | undefined | null): string {
  const num = Math.round(Number(amount || 0));
  const isNegative = num < 0;
  const absStr = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return isNegative ? `-${absStr}` : absStr;
}

export function formatUSD(amount: number | undefined | null): string {
  const num = Math.round(Number(amount || 0));
  if (num < 0) {
    return `-$${formatMoney(Math.abs(num))}`;
  }
  return `$${formatMoney(num)}`;
}

/**
 * To'lov usuli bo'yicha yagona o'zbekcha nom.
 * Qiymatlar backenddagi Payment.PaymentMethod bilan bir xil bo'lishi shart.
 */
export const PAYMENT_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "CASH", label: "Naqd pul" },
  { value: "CARD", label: "Karta / O'tkazma" },
  { value: "BANK", label: "Bank hisobi" },
  { value: "NAQD_USD", label: "Naqd ($ USD)" },
  { value: "NAQD_UZS", label: "Naqd (so'm)" },
  { value: "BANK_KARTA", label: "Bank / Karta" },
  { value: "HISOB_RAQAM", label: "Hisob raqam" },
];

export function paymentMethodLabel(method: string | undefined | null): string {
  const found = PAYMENT_METHOD_OPTIONS.find((m) => m.value === method);
  return found ? found.label : "Bank hisobi";
}

/**
 * Telefon raqamini kiritishda faqat ruxsat etilgan belgilarni qoldiradi
 * (raqam, +, bo'sh joy, -, (), .). Harflar kiritilmaydi.
 */
export function sanitizePhoneInput(value: string): string {
  return (value || "").replace(/[^+\d\s\-().]/g, "");
}

/**
 * Telefon raqami to'g'rimi. Bo'sh qiymat ruxsat etiladi (ixtiyoriy maydon),
 * aks holda 7-15 ta raqam bo'lishi shart.
 */
export function isValidPhone(value: string): boolean {
  const cleaned = (value || "").trim();
  if (!cleaned) return true;
  if (!/^[+\d\s\-().]{7,50}$/.test(cleaned)) return false;
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

const UZ_MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyun",
  "Iyul",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

/**
 * Sanani "2026-10-20" ko'rinishidan "20 Okt, 2026" yoki "20 Okt" ko'rinishiga o'tkazish.
 */
export function formatDate(dateStr: string | undefined | null, includeYear = true): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return dateStr;
  }
  return includeYear ? `${day} ${UZ_MONTHS[monthIdx]}, ${year}` : `${day} ${UZ_MONTHS[monthIdx]}`;
}

export const UZ_WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

/** Bugungi sana mahalliy vaqt bo'yicha "YYYY-MM-DD" ko'rinishida. */
export function getTodayISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Partiyaning oxirgi parvoz sanasi.
 * Borish-kelish partiyalarida — qaytish sanasi, aks holda parvoz sanasi.
 */
export function getBatchExpiryDate(batch: any): string | null {
  if (!batch) return null;
  if (batch.isRoundTrip && batch.returnDate) return batch.returnDate;
  return batch.flightDate || null;
}

/**
 * Partiya muddati o'tganmi — oxirgi parvoz sanasi bugundan oldin bo'lsa.
 * Sana mahalliy vaqt bo'yicha kun boshidan taqqoslanadi.
 */
export function isBatchExpired(batch: any, today: Date = new Date()): boolean {
  const expiry = getBatchExpiryDate(batch);
  if (!expiry) return false;
  const parts = expiry.split("-");
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day)) return false;
  const expiryDate = new Date(year, monthIdx, day);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return expiryDate < todayStart;
}

/**
 * Sanani Aviasales uslubida o'zbekcha qisqa ko'rinishda formatlash:
 * "2026-10-17" -> "Shan, 17-Okt"
 */
export function formatFriendlyDate(dateStr: string | undefined | null, includeWeekday = true): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) {
    return dateStr;
  }
  const dateObj = new Date(year, monthIdx, day);
  const dayName = UZ_WEEKDAYS[dateObj.getDay()];
  const monthName = UZ_MONTHS[monthIdx];
  if (includeWeekday) {
    return `${dayName}, ${day}-${monthName}`;
  }
  return `${day}-${monthName}`;
}

const IATA_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * Sanani "2026-10-20" dan "20OCT" yoki "02NOV" ko'rinishiga o'tkazish
 */
export function formatIataDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "---";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr.toUpperCase();
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return dateStr.toUpperCase();
  }
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  return `${dayStr}${IATA_MONTHS[monthIdx]}`;
}

const CITY_TO_IATA: Record<string, string> = {
  // O'zbekiston
  "toshkent": "TAS",
  "tashkent": "TAS",
  "tas": "TAS",
  "farg'ona": "FEG",
  "fargona": "FEG",
  "fergana": "FEG",
  "feg": "FEG",
  "samarqand": "SKD",
  "samarkand": "SKD",
  "skd": "SKD",
  "namangan": "NMA",
  "nma": "NMA",
  "buxoro": "BHK",
  "bukhara": "BHK",
  "bhk": "BHK",
  "urganch": "UGC",
  "urgench": "UGC",
  "ugc": "UGC",
  "andijon": "AZN",
  "andijan": "AZN",
  "azn": "AZN",
  "nukus": "NCU",
  "ncu": "NCU",
  "navoiy": "NVI",
  "nvi": "NVI",
  "termiz": "TMJ",
  "termez": "TMJ",
  "tmj": "TMJ",

  // BAA / Yaqin Sharq
  "dubay": "DXB",
  "dubai": "DXB",
  "dxb": "DXB",
  "sharja": "SHJ",
  "sharjah": "SHJ",
  "shj": "SHJ",
  "abu-dabi": "AUH",
  "abu dhabi": "AUH",
  "auh": "AUH",
  "jidda": "JED",
  "jeddah": "JED",
  "jed": "JED",
  "madina": "MED",
  "medina": "MED",
  "med": "MED",
  "ar-riyod": "RUH",
  "riyad": "RUH",
  "ruh": "RUH",
  "doha": "DOH",
  "doh": "DOH",
  "kuvayt": "KWI",
  "kuwait": "KWI",
  "kwi": "KWI",

  // Turkiya / Yevropa
  "istanbul": "IST",
  "ist": "IST",
  "antaliya": "AYT",
  "antalya": "AYT",
  "ayt": "AYT",
  "ankara": "ESB",
  "esb": "ESB",

  // Rossiya / MDH
  "moskva": "MOW",
  "moscow": "MOW",
  "mow": "MOW",
  "vko": "VKO",
  "dme": "DME",
  "svo": "SVO",
  "sankt-peterburg": "LED",
  "piter": "LED",
  "led": "LED",
  "olmaota": "ALA",
  "almaty": "ALA",
  "ala": "ALA",
  "ostona": "NQZ",
  "astana": "NQZ",
  "nqz": "NQZ",
  "bishkek": "FRU",
  "fru": "FRU",
  "dushanbe": "DYU",
  "dyu": "DYU",
  "boku": "GYD",
  "baku": "GYD",
  "gyd": "GYD",
  "tbilisi": "TBS",
  "tbs": "TBS",
  "sharm-el-sheyx": "SSH",
  "sharm": "SSH",
  "ssh": "SSH",
};

export const IATA_TO_CITY: Record<string, string> = {
  TAS: "Toshkent",
  FEG: "Farg'ona",
  SKD: "Samarqand",
  NMA: "Namangan",
  BHK: "Buxoro",
  UGC: "Urganch",
  AZN: "Andijon",
  NCU: "Nukus",
  NVI: "Navoiy",
  TMJ: "Termiz",
  DXB: "Dubay",
  SHJ: "Sharja",
  AUH: "Abu-Dabi",
  JED: "Jidda",
  MED: "Madina",
  RUH: "Ar-Riyod",
  DOH: "Doha",
  KWI: "Kuvayt",
  IST: "Istanbul",
  AYT: "Antaliya",
  ESB: "Ankara",
  MOW: "Moskva",
  VKO: "Moskva (VKO)",
  DME: "Moskva (DME)",
  SVO: "Moskva (SVO)",
  LED: "Sankt-Peterburg",
  ALA: "Olmaota",
  NQZ: "Ostona",
  FRU: "Bishkek",
  DYU: "Dushanbe",
  GYD: "Boku",
  TBS: "Tbilisi",
  SSH: "Sharm-el-Sheyx",
};

export function getCityIataCode(cityName: string | undefined | null): string {
  if (!cityName) return "---";
  const clean = cityName.trim().toLowerCase().replace(/['`ʻ’]/g, "'");
  if (CITY_TO_IATA[clean]) return CITY_TO_IATA[clean];
  if (cityName.trim().length === 3) return cityName.trim().toUpperCase();
  return cityName.trim().slice(0, 3).toUpperCase();
}

export function parseRouteCities(routeStr: string | undefined | null): {
  origin: string;
  destination: string;
  originIata: string;
  destIata: string;
} {
  if (!routeStr) return { origin: "Noma'lum", destination: "Noma'lum", originIata: "---", destIata: "---" };
  const separator = routeStr.includes("—")
    ? "—"
    : routeStr.includes(" - ")
    ? " - "
    : routeStr.includes("->")
    ? "->"
    : routeStr.includes("-")
    ? "-"
    : null;

  if (!separator) {
    const raw = routeStr.trim();
    const iata = getCityIataCode(raw);
    const city = IATA_TO_CITY[iata] || raw;
    return { origin: city, destination: "", originIata: iata, destIata: "---" };
  }

  const [fromRaw, toRaw] = routeStr.split(separator).map((s) => s.trim());
  const originIata = getCityIataCode(fromRaw);
  const destIata = getCityIataCode(toRaw);

  const origin = IATA_TO_CITY[fromRaw.toUpperCase()] || fromRaw;
  const destination = IATA_TO_CITY[toRaw.toUpperCase()] || toRaw;

  return {
    origin: origin || "",
    destination: destination || "",
    originIata,
    destIata,
  };
}

/**
 * IATA kodi -> unga tegishli barcha nomlar (o'zbekcha/inglizcha yozilishlar).
 * "TAS - DXB" marshrutini "dubay", "dubai" yoki "dxb" bilan ham topish uchun.
 */
const IATA_SEARCH_ALIASES: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const [alias, code] of Object.entries(CITY_TO_IATA)) {
    (map[code] ||= []).push(alias);
  }
  for (const [code, city] of Object.entries(IATA_TO_CITY)) {
    (map[code] ||= []).push(city);
  }
  return map;
})();

/**
 * Qidiruv matnini bir xillashtirish: kichik harf, apostrof va ajratgichlar olib tashlanadi.
 */
export function normalizeSearchText(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .replace(/['`ʻ’‘]/g, "")
    .replace(/[—–\-_/.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Marshrut uchun qidiruv matni: marshrutning o'zi, IATA kodlari va shahar nomlari.
 * "TAS - DXB" marshruti "dubay", "dubai", "dxb" kabi so'rovlarga ham mos keladi.
 */
export function buildRouteSearchText(route: string | undefined | null): string {
  if (!route) return "";
  const { originIata, destIata } = parseRouteCities(route);
  const parts: (string | undefined)[] = [
    route,
    originIata,
    destIata,
    ...(IATA_SEARCH_ALIASES[originIata] || []),
    ...(IATA_SEARCH_ALIASES[destIata] || []),
  ];
  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

/** Marshrut qidiruv so'roviga mos keladimi. */
export function matchesRouteSearch(route: string | undefined | null, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return buildRouteSearchText(route).includes(q);
}

/**
 * Partiya uchun qidiruv matni: marshrut (IATA kodlari va shahar nomlari bilan),
 * partiya raqami, reys raqamlari, ta'minotchi va bagaj.
 */
export function buildBatchSearchText(batch: any): string {
  if (!batch) return "";
  const parts: (string | undefined)[] = [
    buildRouteSearchText(batch.route),
    batch.batchNumber,
    batch.flightNumber,
    batch.returnFlightNumber,
    batch.supplierName,
    batch.baggage,
  ];
  return normalizeSearchText(parts.filter(Boolean).join(" "));
}

/**
 * Partiya qidiruv so'roviga mos keladimi.
 * Marshrut IATA kodi bilan saqlansa ham, shahar nomi bilan qidirish ishlaydi
 * (masalan "TAS — DXB" partiyasi "dubay" bo'yicha topiladi).
 */
export function matchesBatchSearch(batch: any, query: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return buildBatchSearchText(batch).includes(q);
}

/**
 * Sana "dan-gacha" oralig'ida ekanligini tekshirish.
 * Oraliq tanlanmagan bo'lsa — hamma sana mos keladi.
 * Sana yo'q bo'lsa, lekin oraliq tanlangan bo'lsa — mos kelmaydi.
 */
export function isDateInRange(dateStr: string | undefined | null, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export interface FlightDisplayData {
  origin: string;
  destination: string;
  originIata: string;
  destIata: string;
  isRoundTrip: boolean;
  outboundDate: string;
  outboundTime?: string;
  outboundFlightNumber?: string;
  returnDate?: string | null;
  returnTime?: string | null;
  returnFlightNumber?: string | null;
  batchNumber: string;
}

export function getFlightDisplayData(batch: any): FlightDisplayData {
  const { origin, destination, originIata, destIata } = parseRouteCities(batch?.route);

  const outboundDate = formatFriendlyDate(batch?.flightDate);
  const outboundTime =
    batch?.departureTime && batch?.arrivalTime
      ? `${batch.departureTime} – ${batch.arrivalTime}`
      : batch?.departureTime || undefined;

  const isRoundTrip = Boolean(batch?.isRoundTrip && batch?.returnDate);
  const returnDate = isRoundTrip ? formatFriendlyDate(batch?.returnDate) : null;
  const returnTime =
    isRoundTrip && batch?.returnDepartureTime && batch?.returnArrivalTime
      ? `${batch.returnDepartureTime} – ${batch.returnArrivalTime}`
      : isRoundTrip && batch?.returnDepartureTime
      ? batch.returnDepartureTime
      : null;

  return {
    origin,
    destination,
    originIata,
    destIata,
    isRoundTrip,
    outboundDate,
    outboundTime,
    outboundFlightNumber: batch?.flightNumber || undefined,
    returnDate,
    returnTime,
    returnFlightNumber: batch?.returnFlightNumber || undefined,
    batchNumber: batch?.batchNumber || "---",
  };
}

export interface StructuredFlightLeg {
  date: string;
  flightNumber: string;
  originIata: string;
  destIata: string;
  depTime: string;
  arrTime: string;
  plainText: string;
}

export function buildFlightLeg(data: {
  date?: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  depTime?: string;
  arrTime?: string;
}): StructuredFlightLeg {
  const dateIata = formatIataDate(data.date);
  const flightNum = (data.flightNumber || "---").replace(/\s+/g, "").toUpperCase();
  const orig = getCityIataCode(data.origin) || "---";
  const dest = getCityIataCode(data.destination) || "---";
  const dep = data.depTime || "--:--";
  const arr = data.arrTime || "--:--";
  const plainText = `${dateIata} ${flightNum} ${orig}  ${dest}   ${dep}    ${arr}`;

  return {
    date: dateIata,
    flightNumber: flightNum,
    originIata: orig,
    destIata: dest,
    depTime: dep,
    arrTime: arr,
    plainText,
  };
}

export function formatFlightLeg(data: {
  date?: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  depTime?: string;
  arrTime?: string;
}): string {
  return buildFlightLeg(data).plainText;
}

export interface BatchFlightSchedule {
  outbound: StructuredFlightLeg;
  inbound: StructuredFlightLeg | null;
  clipboardText: string;
  routeFull: string;
}

/**
 * Aviakassalar standart reys jadvali:
 * 20OCT 7Q2703 FEG  JED   15:30    20:30
 * 02NOV 7Q2702 JED  FEG   23:10  06:20
 */
export function getBatchFlightSchedule(batch: any): BatchFlightSchedule {
  const emptyLeg: StructuredFlightLeg = {
    date: "---",
    flightNumber: "---",
    originIata: "---",
    destIata: "---",
    depTime: "--:--",
    arrTime: "--:--",
    plainText: "---",
  };

  if (!batch) {
    return { outbound: emptyLeg, inbound: null, clipboardText: "", routeFull: "" };
  }

  const { origin, destination, originIata, destIata } = parseRouteCities(batch.route);

  const outbound = buildFlightLeg({
    date: batch.flightDate,
    flightNumber: batch.flightNumber || batch.batchNumber,
    origin: originIata,
    destination: destIata,
    depTime: batch.departureTime,
    arrTime: batch.arrivalTime,
  });

  let inbound: StructuredFlightLeg | null = null;
  const isRoundTrip = Boolean(batch.isRoundTrip && batch.returnDate);

  if (isRoundTrip) {
    inbound = buildFlightLeg({
      date: batch.returnDate,
      flightNumber: batch.returnFlightNumber || batch.flightNumber || batch.batchNumber,
      origin: destIata,
      destination: originIata,
      depTime: batch.returnDepartureTime || batch.departureTime,
      arrTime: batch.returnArrivalTime || batch.arrivalTime,
    });
  }

  const clipboardText = inbound
    ? `${outbound.plainText}\n${inbound.plainText}`
    : outbound.plainText;

  const routeFull = origin && destination ? `${origin} — ${destination}` : batch.route || "";

  return {
    outbound,
    inbound,
    clipboardText,
    routeFull,
  };
}


