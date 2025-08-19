"use client";

import { isoWeekString } from "@/lib/coupons";
import { useI18n } from "@/lib/i18n";

export default function WeeklyBadge() {
  const { t } = useI18n();
  return (
    <span className="badge" role="status" aria-live="polite">
      🔄 {t("games.weekly")} · {isoWeekString(new Date())}
    </span>
  );
}
