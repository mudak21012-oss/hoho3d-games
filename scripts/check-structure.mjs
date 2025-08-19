// scripts/check-structure.mjs
// Verifica que existan los archivos mínimos y chequea dependencias clave.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const mustHaveFiles = [
  ".devcontainer/devcontainer.json",
  "public/filipo.svg",
  "public/icons/bed.svg",
  "public/icons/nozzle.svg",
  "public/icons/filament.svg",
  "public/icons/extruder.svg",
  "public/icons/temp.svg",
  "public/icons/infill.svg",
  "public/icons/speed.svg",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/juegos/inicial/page.tsx",
  "src/app/juegos/media/page.tsx",
  "src/app/juegos/alta/page.tsx",
  "src/app/api/coupons/route.ts",
  "src/components/Filipo.tsx",
  "src/components/LoginGate.tsx",
  "src/components/LanguageSwitcher.tsx",
  "src/components/GameCard.tsx",
  "src/components/WeeklyBadge.tsx",
  "src/components/Toast.tsx",
  "src/lib/i18n.ts",
  "src/lib/coupons.ts",
  "src/lib/difficulty.ts",
  ".env.example",
  "tailwind.config.ts",
  "postcss.config.js",
  "tsconfig.json",
  "README.md",
  "package.json",
];

const missing = [];
for (const rel of mustHaveFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) missing.push(rel);
}

// Extra: chequeos de package.json y Tailwind
let pkg = null;
try {
  pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
} catch {}
const depsCheck = [];
function has(dep) {
  return (
    (pkg?.dependencies && pkg.dependencies[dep]) ||
    (pkg?.devDependencies && pkg.devDependencies[dep])
  );
}
[
  "next",
  "react",
  "react-dom",
  "typescript",
  "tailwindcss",
  "postcss",
  "autoprefixer",
].forEach((d) => {
  if (!has(d)) depsCheck.push(d);
});

const tailwindConfigPath = path.join(root, "tailwind.config.ts");
let tailwindContentOK = false;
if (fs.existsSync(tailwindConfigPath)) {
  const content = fs.readFileSync(tailwindConfigPath, "utf8");
  // Contenido esperado para buscar templates de Next en src
  tailwindContentOK = /\.\.\/|src\/\*\*\/\*\.\{js,ts,jsx,tsx\}/.test(content) || /content:\s*\[.*"\.\/src\/\*\*\/\*\.\{js,ts,jsx,tsx\}".*\]/s.test(content);
}

function log(ok, msg) {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${msg}`);
}

console.log("🔎 Verificando estructura de Hoho3D Games...\n");

if (missing.length === 0) {
  log(true, "Todos los archivos mínimos existen.");
} else {
  log(false, "Faltan archivos:");
  missing.forEach((m) => console.log("   - " + m));
}

if (!pkg) {
  log(false, "No pude leer package.json");
} else {
  log(true, "package.json encontrado");
  if (depsCheck.length) {
    log(false, "Faltan dependencias clave:");
    depsCheck.forEach((d) => console.log("   - " + d));
  } else {
    log(true, "Dependencias clave presentes (Next, React, TS, Tailwind, PostCSS).");
  }

  const hasScripts =
    pkg.scripts &&
    pkg.scripts.dev &&
    pkg.scripts.build &&
    pkg.scripts.start;

  if (!hasScripts) {
    log(false, 'Faltan scripts en package.json. Recomendado: "dev", "build", "start".');
  } else {
    log(true, 'Scripts "dev", "build" y "start" existen.');
  }
}

if (fs.existsSync("postcss.config.js")) {
  log(true, "postcss.config.js existe");
} else {
  log(false, "Falta postcss.config.js");
}
if (fs.existsSync("tsconfig.json")) {
  log(true, "tsconfig.json existe");
} else {
  log(false, "Falta tsconfig.json");
}
if (fs.existsSync("src/app/globals.css")) {
  log(true, "globals.css existe");
} else {
  log(false, "Falta src/app/globals.css");
}

if (fs.existsSync("tailwind.config.ts")) {
  log(true, "tailwind.config.ts existe" + (tailwindContentOK ? " (content OK)" : " (revisa content[])"));
} else {
  log(false, "Falta tailwind.config.ts");
}

console.log("\n📦 Sugerencia: ejecuta `npm run build` para validar la app compila.");
if (missing.length || depsCheck.length || !tailwindContentOK) {
  process.exitCode = 1; // Falla en CI si hay faltantes
}
