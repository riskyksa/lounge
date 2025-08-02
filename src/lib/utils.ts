import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toArabicNumber(num: number | string) {
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}
export function arabicToEnglishNumber(str: string) {
  return str.replace(
    /[٠-٩]/g,
    (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]
  );
}


