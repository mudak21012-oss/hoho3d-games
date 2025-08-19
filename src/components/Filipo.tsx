"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";

export default function Filipo({
  message,
  mood = "happy",
  ariaLabel,
  className,
}: {
  message: string;
  mood?: "happy" | "guide" | "alert";
  ariaLabel?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const emoji = mood === "alert" ? "⚠️" : mood === "guide" ? "🧠" : "😄";
  return (
    <div className={`flex items-start gap-3 ${className || ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/filipo.svg"
        alt="Filipo"
        className="h-12 w-12 flex-shrink-0 rounded-lg"
      />
      <div className="flex-1">
        <div
          className="relative rounded-2xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-100 shadow-lg"
          role="note"
          aria-label={ariaLabel || "Filipo message"}
        >
          <div className="absolute -left-2 top-3 h-0 w-0 border-y-8 border-r-8 border-y-transparent border-r-neutral-900" />
          <p>
            <span className="mr-1">{emoji}</span> {message}
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            {t("filipo.signoff")}
          </p>
        </div>
      </div>
    </div>
  );
}
