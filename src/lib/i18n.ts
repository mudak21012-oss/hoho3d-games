"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Dict = Record<string, any>;

const es: Dict = {
  lang: { label: "Idioma" },
  home: {
    title: "Juegos oficiales",
    subtitle:
      "3 niveles, 3 mini-juegos, 3 premios. Aprende sobre impresión 3D con Filipo y la comunidad Hoho3D.",
    filipo:
      "¡Bienvenid@! Yo soy Filipo. Si te atoras, te doy una mano (o una boquilla).",
  },
  login: {
    title: "Inicia para guardar tu premio",
    name: "Nombre",
    email: "Email",
    save: "Guardar",
    continueAs: "Continuar como",
    logout: "Salir",
  },
  privacy: {
    title: "Privacidad",
    text:
      "Usaremos tu Nombre y Email únicamente para validar y entregarte premios (cupones/beneficios). Puedes borrar tus datos desde esta misma pantalla.",
    consent:
      "Acepto el uso de mis datos con fines de entrega de premios (cupones/beneficios).",
    helper: "Necesitamos tu consentimiento para poder asignarte cupones.",
  },
  games: {
    initial: {
      title: "Memory Print",
      desc: "Encuentra parejas de íconos de impresión 3D. 3 rondas cortas con pistas.",
      reward: "Cupón sorpresa",
    },
    medium: {
      title: "Slicer Sort",
      desc: "Arrastra parámetros de slicing a su categoría correcta. Puntos por precisión y tiempo.",
      reward: "Envío gratis (según stock)",
      layer: "Altura de capa",
      infill: "Infill",
      temp: "Temperatura",
      speed: "Velocidad",
      poolEmpty: "No hay fichas en la bandeja. ¡Sigue clasificando!",
    },
    hard: {
      title: "G-Code Maze",
      desc: "Traza una ruta óptima evitando fallos. Movimiento limitado (filamento) y peligros.",
      reward: "Producto sorpresa",
      filament: "Filamento",
    },
    level: { initial: "Inicial", medium: "Media", hard: "Alta" },
    round: "Ronda",
    hint: "Pista",
    weekly: "Códigos semanales",
    weeklyNotice: "Se entregarán ciertos códigos cada semana y se actualizará semana a semana.",
    score: "Puntos",
    reward: "Recompensa",
    win: "¡Ganaste! ¡Bien jugado!",
  },
  actions: {
    play: "Jugar",
    retry: "Reintentar",
    menu: "Menú",
    undo: "Deshacer",
    claimReward: "Reclamar recompensa",
  },
  coupons: {
    success: "¡Código asignado!",
    error: "No se pudo asignar un código",
    code: "Código",
    type: "Tipo",
  },
  errors: {
    noUser: "Necesitas iniciar sesión primero.",
    nameRequired: "El nombre es obligatorio.",
    emailInvalid: "El email no parece válido.",
    consentRequired: "Debes aceptar el consentimiento.",
  },
  toasts: {
    loginSaved: "Datos guardados. ¡A jugar!",
    loggedOut: "Sesión cerrada y datos borrados.",
  },
  filipo: {
    signoff: "Tip: ¡usa Tab y Enter! Soportamos teclado completo.",
  },
};

const en: Dict = {
  lang: { label: "Language" },
  home: {
    title: "Official games",
    subtitle:
      "3 levels, 3 mini-games, 3 rewards. Learn 3D printing with Filipo and the Hoho3D community.",
    filipo:
      "Welcome! I'm Filipo. If you get stuck, I’ll help (or swap a nozzle).",
  },
  login: {
    title: "Sign in to save your reward",
    name: "Name",
    email: "Email",
    save: "Save",
    continueAs: "Continue as",
    logout: "Logout",
  },
  privacy: {
    title: "Privacy",
    text:
      "We use your Name and Email only to validate and deliver rewards (coupons/benefits). You can clear your data here anytime.",
    consent:
      "I consent to the use of my data to deliver rewards (coupons/benefits).",
    helper: "We need your consent to assign coupons.",
  },
  games: {
    initial: {
      title: "Memory Print",
      desc: "Find pairs of 3D-printing icons. 3 short rounds with hints.",
      reward: "Surprise coupon",
    },
    medium: {
      title: "Slicer Sort",
      desc: "Drag slicing parameters to the correct category. Points for accuracy and time.",
      reward: "Free shipping (subject to stock)",
      layer: "Layer Height",
      infill: "Infill",
      temp: "Temperature",
      speed: "Speed",
      poolEmpty: "No tokens in the tray. Keep sorting!",
    },
    hard: {
      title: "G-Code Maze",
      desc: "Draw an optimal path avoiding failures. Limited moves (filament) and hazards.",
      reward: "Mystery product",
      filament: "Filament",
    },
    level: { initial: "Easy", medium: "Medium", hard: "Hard" },
    round: "Round",
    hint: "Hint",
    weekly: "Weekly codes",
    weeklyNotice: "Certain codes will be delivered every week and updated week by week.",
    score: "Score",
    reward: "Reward",
    win: "You won! Well played!",
  },
  actions: {
    play: "Play",
    retry: "Retry",
    menu: "Menu",
    undo: "Undo",
    claimReward: "Claim reward",
  },
  coupons: {
    success: "Code assigned!",
    error: "Could not assign a code",
    code: "Code",
    type: "Type",
  },
  errors: {
    noUser: "You need to log in first.",
    nameRequired: "Name is required.",
    emailInvalid: "Email looks invalid.",
    consentRequired: "You must accept consent.",
  },
  toasts: {
    loginSaved: "Saved. Have fun!",
    loggedOut: "Logged out and data cleared.",
  },
  filipo: {
    signoff: "Tip: use Tab and Enter! Full keyboard supported.",
  },
};

type Lang = "es" | "en";
const I18nCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}>({
  lang: "es",
  setLang: () => {},
  t: (k) => k,
});

function get(path: string, dict: Dict): string {
  return path
    .split(".")
    .reduce((acc: any, k: string) => (acc ? acc[k] : undefined), dict) ?? path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  useEffect(() => {
    const saved = localStorage.getItem("hoho3d:lang");
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("hoho3d:lang", l);
    document.documentElement.lang = l;
  };
  const t = (key: string) => get(key, lang === "es" ? es : en);
  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}
