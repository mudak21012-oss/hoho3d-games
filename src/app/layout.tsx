import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Hoho3D Games",
  description:
    "Mini-juegos web de Hoho3D con recompensas semanales. Aprende, juega y gana con Filipo.",
  icons: [{ rel: "icon", url: "/filipo.svg" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server component: envolvemos con proveedor i18n (cliente)
  return (
    <html lang="es">
      <body className="min-h-dvh bg-neutral-950 text-neutral-100">
        <I18nProvider>
          <header className="sticky top-0 z-20 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src="/filipo.svg"
                  alt="Filipo"
                  className="h-9 w-9 rounded-lg"
                />
                <span className="text-lg font-bold tracking-tight">
                  Hoho3D Games
                </span>
              </div>
              <LanguageSwitcher />
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-400">
            <p>
              © {new Date().getFullYear()} Hoho3D — Datos de contacto usados
              únicamente para entrega de premios.{" "}
              <a
                href="#privacy"
                className="underline decoration-dotted underline-offset-4"
              >
                Ver aviso de privacidad
              </a>
            </p>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
