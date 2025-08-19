"use client";

import { useEffect, useMemo, useState } from "react";
import LoginGate from "@/components/LoginGate";
import GameCard from "@/components/GameCard";
import Filipo from "@/components/Filipo";
import WeeklyBadge from "@/components/WeeklyBadge";
import { useI18n } from "@/lib/i18n";

type User = { name: string; email: string };

export default function HomePage() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("hoho3d:user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const games = useMemo(
    () => [
      {
        level: "inicial",
        path: "/juegos/inicial",
        title: t("games.initial.title"),
        description: t("games.initial.desc"),
        reward: t("games.initial.reward"),
      },
      {
        level: "media",
        path: "/juegos/media",
        title: t("games.medium.title"),
        description: t("games.medium.desc"),
        reward: t("games.medium.reward"),
      },
      {
        level: "alta",
        path: "/juegos/alta",
        title: t("games.hard.title"),
        description: t("games.hard.desc"),
        reward: t("games.hard.reward"),
      },
    ],
    [t]
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <div className="card">
          <h1 className="mb-2 text-2xl font-extrabold">
            {t("home.title")} <span className="text-orange-400">Hoho3D</span>
          </h1>
          <p className="mb-4 text-neutral-300">{t("home.subtitle")}</p>
          <WeeklyBadge />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {games.map((g) => (
              <GameCard key={g.level} {...g} />
            ))}
          </div>
        </div>
        <div className="card grid items-start gap-4">
          <Filipo
            mood="happy"
            message={t("home.filipo")}
            ariaLabel="Filipo da la bienvenida"
          />
          <LoginGate
            onLogin={(u) => setUser(u)}
            showLogout={Boolean(user)}
            className="mt-2"
          />
        </div>
      </section>

      <section id="privacy" className="card">
        <h2 className="mb-2 text-lg font-bold">{t("privacy.title")}</h2>
        <p className="text-sm text-neutral-300">{t("privacy.text")}</p>
      </section>
    </div>
  );
}
