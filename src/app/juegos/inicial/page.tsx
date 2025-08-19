"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Filipo from "@/components/Filipo";
import WeeklyBadge from "@/components/WeeklyBadge";
import { useI18n } from "@/lib/i18n";

type Card = { id: number; icon: string; matched: boolean };

const ICONS = [
  "/icons/nozzle.svg",
  "/icons/bed.svg",
  "/icons/filament.svg",
  "/icons/extruder.svg",
  "/icons/gear.svg",
  "/icons/printer.svg",
  "/icons/thermometer.svg",
  "/icons/infill.svg",
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createDeck(pairs: number): Card[] {
  const chosen = ICONS.slice(0, pairs);
  const deck = chosen
    .flatMap((icon, i) => [
      { id: i * 2, icon, matched: false },
      { id: i * 2 + 1, icon, matched: false },
    ])
    .map((c, idx) => ({ ...c, id: idx }));
  return shuffle(deck);
}

export default function JuegoInicial() {
  const { t } = useI18n();
  const [round, setRound] = useState(1); // 1..3
  const [deck, setDeck] = useState<Card[]>(() => createDeck(4));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [hints, setHints] = useState(2);
  const [won, setWon] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const allMatched = deck.every((c) => c.matched);
    if (allMatched) {
      if (round < 3) {
        // siguiente ronda, más pares
        const nextPairs = 4 + round; // 4,5,6
        setRound((r) => r + 1);
        setDeck(createDeck(nextPairs));
        setFlipped([]);
        setMoves(0);
        setHints(Math.max(1, hints - 1)); // menos pistas con el tiempo
        setTime(0);
      } else {
        setWon(true);
      }
    }
  }, [deck, round, hints]);

  const handleFlip = (idx: number) => {
    if (won) return;
    if (flipped.includes(idx) || deck[idx].matched) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].icon === deck[b].icon) {
        // match
        setTimeout(() => {
          setDeck((d) =>
            d.map((c, i) =>
              i === a || i === b ? { ...c, matched: true } : c
            )
          );
          setFlipped([]);
        }, 300);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    } else if (next.length > 2) {
      setFlipped([idx]);
    }
  };

  const handleHint = () => {
    if (hints <= 0) return;
    setHints((h) => h - 1);
    const hiddenIdxs = deck
      .map((c, i) => ({ c, i }))
      .filter(({ c, i }) => !c.matched && !flipped.includes(i))
      .map(({ i }) => i);
    setFlipped((f) => [...f, ...hiddenIdxs]);
    setTimeout(() => setFlipped([]), 1400);
  };

  const progress = useMemo(() => (round / 3) * 100, [round]);

  const reset = () => {
    setRound(1);
    setDeck(createDeck(4));
    setFlipped([]);
    setMoves(0);
    setTime(0);
    setHints(2);
    setWon(false);
  };

  const claimReward = async () => {
    const userRaw = localStorage.getItem("hoho3d:user");
    if (!userRaw) return alert(t("errors.noUser"));
    const user = JSON.parse(userRaw) as { email: string; name: string };
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, level: "inicial" }),
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

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">
          {t("games.initial.title")} —{" "}
          <span className="text-orange-400">{t("games.level.initial")}</span>
        </h1>
        <WeeklyBadge />
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${progress}%` }} />
            </div>
            <div className="ml-4 text-sm text-neutral-300">
              {t("games.round")} {round}/3 · ⏱ {time}s · 🎯 {moves}
            </div>
          </div>

          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                deck.length <= 8 ? "repeat(4, minmax(0, 1fr))" : "repeat(6, 1fr)",
            }}
          >
            {deck.map((card, idx) => {
              const show = flipped.includes(idx) || card.matched;
              return (
                <button
                  key={card.id}
                  onClick={() => handleFlip(idx)}
                  className="relative aspect-square rounded-xl border border-neutral-700 bg-neutral-900 focus-visible:outline"
                  aria-pressed={show}
                >
                  <div
                    className={`absolute inset-0 grid place-items-center transition-transform duration-200 ${
                      show ? "scale-100" : "scale-0"
                    }`}
                  >
                    <img
                      src={card.icon}
                      alt=""
                      className="h-12 w-12"
                      aria-hidden
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={handleHint} className="btn btn-secondary" disabled={hints <= 0}>
              💡 {t("games.hint")} ({hints})
            </button>
            <button onClick={reset} className="btn btn-secondary">
              🔄 {t("actions.retry")}
            </button>
            <a href="/" className="btn btn-secondary">🏠 {t("actions.menu")}</a>
          </div>
        </div>

        <aside className="card grid gap-3">
          <Filipo
            mood="guide"
            message={t("games.initial.rules")}
            ariaLabel="Reglas del juego por Filipo"
          />
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
