"use client";

import { translations } from "@/constants/i18n";
import type { Translation } from "@/types";

export function useTranslations(): Translation {
  return translations.zh;
}
