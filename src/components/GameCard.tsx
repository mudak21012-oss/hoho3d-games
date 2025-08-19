"use client";

import { useI18n } from "@/lib/i18n";

export default function GameCard({
  title,
  description,
  reward,
  path,
}: {
  title: string;
  description: string;
  reward: string;
  path: string;
}) {
  const { t } = useI18n();
  return (
    <article className="card grid gap-2">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-neutral-300">{description}</p>
      <div className="text-xs text-neutral-400">🎁 {t("games.reward")}: {reward}</div>
      <a href={path} className="btn btn-primary mt-2 w-full" aria-label={`${t("actions.play")} ${title}`}>
        🎮 {t("actions.play")}
      </a>
    </article>
  );
}
