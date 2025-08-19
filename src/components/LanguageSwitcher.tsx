"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="lang" className="text-sm text-neutral-400">
        {t("lang.label")}
      </label>
      <select
        id="lang"
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1 text-sm"
        aria-label={t("lang.label")}
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </div>
  );
}
