const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function belowThousand(n: number): string {
  if (n < 100) return belowHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredPart = `${ONES[hundreds]} Hundred`;
  if (!rest) return hundredPart;
  return `${hundredPart} ${belowHundred(rest)}`;
}

function numberToIndianWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return "Zero";
  const n = Math.round(amount);
  if (n === 0) return "Zero";

  let remaining = n;
  const parts: string[] = [];

  const crore = Math.floor(remaining / 10_000_000);
  remaining %= 10_000_000;
  if (crore) parts.push(`${belowHundred(crore)} Crore`);

  const lakh = Math.floor(remaining / 100_000);
  remaining %= 100_000;
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);

  if (remaining) parts.push(belowThousand(remaining));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function rupeesInWords(amount: number): string {
  return `Rupees ${numberToIndianWords(amount)} Only`;
}
