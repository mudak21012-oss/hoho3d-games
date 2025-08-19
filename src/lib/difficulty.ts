// Utilidades simples de dificultad (not used heavily but handy for future tuning)

export type Level = "inicial" | "media" | "alta";

export function timeLimit(level: Level) {
  switch (level) {
    case "inicial":
      return 90;
    case "media":
      return 120;
    case "alta":
      return 180;
  }
}

export function hintCount(level: Level) {
  switch (level) {
    case "inicial":
      return 2;
    case "media":
      return 1;
    case "alta":
      return 0;
  }
}
