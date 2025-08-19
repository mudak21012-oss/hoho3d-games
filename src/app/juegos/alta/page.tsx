"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Filipo from "@/components/Filipo";
import WeeklyBadge from "@/components/WeeklyBadge";
import { useI18n } from "@/lib/i18n";

type Cell = { x: number; y: number; hazard?: boolean; start?: boolean; goal?: boolean };

function genGrid(size: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) row.push({ x, y });
    grid.push(row);
  }
  // Start & goal
  grid[0][0].start = true;
  grid[size - 1][size - 1].goal = true;
  // Hazards
  const hazardCount = Math.floor(size * 1.4);
  let placed = 0;
  while (placed < hazardCount) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const c = grid[y][x];
    if (c.start || c.goal || c.hazard) continue;
    c.hazard = Math.random() < 0.6; // not every selection
    placed++;
  }
  return grid;
}

export default function JuegoAlto() {
  const { t } = useI18n();
  const [size, setSize] = useState(12);
  const [grid, setGrid] = useState<Cell[][]>(() => genGrid(12));
  const [path, setPath] = useState<string[]>(["0,0"]);
  const [budget, setBudget] = useState(26); // movimientos permitidos (filamento)
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => setTime((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const current = useMemo(() => {
    const last = path[path.length - 1].split(",").map(Number);
    return { x: last[0], y: last[1] };
  }, [path]);

  const neighbors = useMemo(() => {
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    return dirs
      .map(({ dx, dy }) => ({ x: current.x + dx, y: current.y + dy }))
      .filter((p) => p.x >= 0 && p.x < size && p.y >= 0 && p.y < size);
  }, [current, size]);

  const isHazard = (x: number, y: number) => grid[y][x].hazard === true;
  const isGoal = (x: number, y: number) => grid[y][x].goal === true;

  const stepTo = (x: number, y: number) => {
    if (won) return;
    const key = `${x},${y}`;
    const last = path[path.length - 1];
    const [lx, ly] = last.split(",").map(Number);
    const dist = Math.abs(lx - x) + Math.abs(ly - y);
    if (dist !== 1) return; // solo vecinos inmediatos
    if (budget <= 0) return;
    if (isHazard(x, y)) {
      // penalización
      setBudget((b) => Math.max(0, b - 2));
      return;
    }
    setPath((p) => [...p, key]);
    setBudget((b) => b - 1);
    if (isGoal(x, y)) {
      setWon(true);
    }
  };

  const reset = () => {
    const newSize = 12 + Math.floor(Math.random() * 3); // procedural ligero
    setSize(newSize);
    setGrid(genGrid(newSize));
    setPath(["0,0"]);
    setBudget(Math.max(22, Math.floor(newSize * 2)));
    setWon(false);
    setTime(0);
  };

  const undo = () => {
    if (path.length <= 1) return;
    setPath((p) => p.slice(0, -1));
    setBudget((b) => b + 1);
  };

  const claimReward = async () => {
    const userRaw = localStorage.getItem("hoho3d:user");
    if (!userRaw) return alert(t("errors.noUser"));
    const user = JSON.parse(userRaw) as { email: string };
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, level: "alta" }),
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
          {t("games.hard.title")} —{" "}
          <span className="text-orange-400">{t("games.level.hard")}</span>
        </h1>
        <WeeklyBadge />
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_.8fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between text-sm text-neutral-300">
            <div>⏱ {time}s</div>
            <div>🧵 {t("games.hard.filament")}: {budget}</div>
          </div>

          <div
            className="grid gap-[6px] bg-neutral-900 p-[6px] rounded-xl border border-neutral-800"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => {
                const key = `${x},${y}`;
                const onPath = path.includes(key);
                const isCurrent = key === path[path.length - 1];
                const isStart = cell.start;
                const isEnd = cell.goal;
                return (
                  <button
                    key={key}
                    onClick={() => stepTo(x, y)}
                    className={`aspect-square rounded-md border ${
                      cell.hazard
                        ? "border-red-800 bg-red-900/30"
                        : "border-neutral-700 bg-neutral-800"
                    } ${onPath ? "ring-2 ring-orange-500" : ""} ${
                      isCurrent ? "outline outline-2 outline-orange-400" : ""
                    }`}
                    aria-label={`cell-${x}-${y}`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isStart && <span className="text-xs">🟢</span>}
                    {isEnd && <span className="text-xs">🏁</span>}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={undo} className="btn btn-secondary">
              ↩️ {t("actions.undo")}
            </button>
            <button onClick={reset} className="btn btn-secondary">
              🔄 {t("actions.retry")}
            </button>
            <a href="/" className="btn btn-secondary">🏠 {t("actions.menu")}</a>
          </div>
        </div>

        <aside className="card grid gap-3">
          <Filipo mood="guide" message={t("games.hard.rules")} ariaLabel="Reglas por Filipo" />
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
