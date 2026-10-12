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
