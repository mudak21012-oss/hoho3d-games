"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Filipo from "@/components/Filipo";
import WeeklyBadge from "@/components/WeeklyBadge";
import { useI18n } from "@/lib/i18n";

type Token = {
  id: string;
  label: string;
  category: "layer" | "infill" | "temp" | "speed";
};

const CATEGORIES = [
  { key: "layer", name: "Layer Height" },
  { key: "infill", name: "Infill" },
  { key: "temp", name: "Temperature" },
  { key: "speed", name: "Speed" },
] as const;

function makeTokens(): Token[] {
  const pool: Token[] = [
    { id: "t1", label: "0.12 mm", category: "layer" },
    { id: "t2", label: "0.2 mm", category: "layer" },
    { id: "t3", label: "15%", category: "infill" },
    { id: "t4", label: "40%", category: "infill" },
    { id: "t5", label: "200°C", category: "temp" },
    { id: "t6", label: "220°C", category: "temp" },
    { id: "t7", label: "40 mm/s", category: "speed" },
    { id: "t8", label: "80 mm/s", category: "speed" },
  ];
  return pool.sort(() => Math.random() - 0.5);
}

export default function JuegoMedio() {
  const { t } = useI18n();
  const [tokens, setTokens] = useState<Token[]>(makeTokens());
  const [buckets, setBuckets] = useState<Record<string, Token[]>>({
    layer: [],
    infill: [],
    temp: [],
    speed: [],
  });
  const [pool, setPool] = useState<Token[]>(tokens);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const timerRef = useRef<number | null>(null);
  const penaltiesRef = useRef(0);

  useEffect(() => {
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const totalPlaced = Object.values(buckets).reduce((a, b) => a + b.length, 0);
    if (totalPlaced === tokens.length) {
      setWon(true);
      const bonus = Math.max(0, 60 - time);
      setScore((s) => s + bonus);
    }
  }, [buckets, tokens.length, time]);

  const onDragStart = (e: React.DragEvent, token: Token) => {
    e.dataTransfer.setData("text/plain", token.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (e: React.DragEvent, bucket: (typeof CATEGORIES)[number]["key"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const token =
      pool.find((t) => t.id === id) ||
      Object.values(buckets).flat().find((t) => t.id === id);
    if (!token) return;

    // Remove from previous
    setPool((p) => p.filter((t) => t.id !== id));
    setBuckets((b) => {
      const nb = { ...b };
      for (const k of Object.keys(nb)) {
        nb[k] = nb[k].filter((t) => t.id !== id);
      }
      // Right or wrong?
      if (token.category === bucket) {
        nb[bucket] = [...nb[bucket], token];
        setScore((s) => s + 10);
      } else {
        // mild penalty
        penaltiesRef.current += 1;
        setScore((s) => s - 3);
        // Put it back to pool to retry
        setPool((p) => [token, ...p]);
      }
      return nb;
    });
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const reset = () => {
    setTokens(makeTokens());
    setBuckets({ layer: [], infill: [], temp: [], speed: [] });
    setPool(makeTokens());
    setScore(0);
    setTime(0);
    setWon(false);
    penaltiesRef.current = 0;
  };

  const claimReward = async () => {
    const userRaw = localStorage.getItem("hoho3d:user");
    if (!userRaw) return alert(t("errors.noUser"));
    const user = JSON.parse(userRaw) as { email: string };
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, level: "media" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      alert(
        t("coupons.success") + `\n` + t("coupons.code") + `: ${data.code}${
          data.type ? `\n${t("coupons.type")}: ${data.type}` : ""
        }`
      );
    } catch (e: any) {
      alert(t("coupons.error") + ": " + e.message);
    }
  };

  const accuracy = useMemo(() => {
    const correct = Object.entries(buckets).reduce(
      (acc, [k, arr]) => acc + arr.filter((t) => t.category === (k as any)).length,
      0
    );
    const total = Object.values(buckets).reduce((a, b) => a + b.length, 0);
    return total ? Math.round((correct / total) * 100) : 0;
  }, [buckets]);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">
          {t("games.medium.title")} —{" "}
          <span className="text-orange-400">{t("games.level.medium")}</span>
        </h1>
        <WeeklyBadge />
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between text-sm text-neutral-300">
            <div>⏱ {time}s</div>
            <div>⭐ {t("games.score")}: {score} · 🎯 {accuracy}%</div>
          </div>

          <section aria-label="Pool" className="mb-4">
            <div className="flex flex-wrap gap-2">
              {pool.map((tok) => (
                <div
                  key={tok.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, tok)}
                  className="badge cursor-grab border border-neutral-700"
                  aria-grabbed="true"
                  role="button"
                  tabIndex={0}
                >
                  {tok.label}
                </div>
              ))}
              {pool.length === 0 && (
                <span className="text-sm text-neutral-400">
                  {t("games.medium.poolEmpty")}
                </span>
              )}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                onDrop={(e) => onDrop(e, c.key)}
                onDragOver={onDragOver}
                className="rounded-xl border border-neutral-700 p-3"
                aria-label={c.name}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{t(`games.medium.${c.key}`)}</span>
                  <span className="text-xs text-neutral-400">
                    {buckets[c.key].length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 min-h-10">
                  {buckets[c.key].map((tok) => (
                    <span key={tok.id} className="badge border border-neutral-700">
                      {tok.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={reset} className="btn btn-secondary">
              🔄 {t("actions.retry")}
            </button>
            <a href="/" className="btn btn-secondary">🏠 {t("actions.menu")}</a>
          </div>
        </div>

        <aside className="card grid gap-3">
          <Filipo mood="guide" message={t("games.medium.rules")} ariaLabel="Reglas por Filipo" />
          {won ? (
            <div className="rounded-lg border border-green-700 bg-green-900/40 p-4">
              <p className="mb-3 font-semibold">🏆 {t("games.win")}</p>
              <button onClick={claimReward} className="btn btn-primary">
                🎁 {t("actions.claimReward")}
              </button>
            </div>
          ) : (
            <p className="text-sm text-neutral-300">
              {t("games.weeklyNotice")}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
