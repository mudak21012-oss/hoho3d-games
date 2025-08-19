"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function LoginGate({
  onLogin,
  showLogout = false,
  className,
}: {
  onLogin?: (u: { name: string; email: string }) => void;
  showLogout?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState<{ name: string; email: string } | null>(
    null
  );

  useEffect(() => {
    const raw = localStorage.getItem("hoho3d:user");
    if (raw) {
      const u = JSON.parse(raw);
      setSaved(u);
      setName(u.name);
      setEmail(u.email);
      setConsent(true);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert(t("errors.nameRequired"));
    if (!email.includes("@")) return alert(t("errors.emailInvalid"));
    if (!consent) return alert(t("errors.consentRequired"));
    const u = { name: name.trim(), email: email.trim().toLowerCase() };
    localStorage.setItem("hoho3d:user", JSON.stringify(u));
    setSaved(u);
    onLogin?.(u);
    alert(t("toasts.loginSaved"));
  };

  const logout = () => {
    localStorage.removeItem("hoho3d:user");
    setSaved(null);
    setName("");
    setEmail("");
    setConsent(false);
    alert(t("toasts.loggedOut"));
  };

  return (
    <div className={`rounded-xl border border-neutral-800 bg-neutral-900 p-4 ${className || ""}`}>
      {saved ? (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {t("login.continueAs")} <strong>{saved.name}</strong> ({saved.email})
          </div>
          {showLogout && (
            <button onClick={logout} className="btn btn-secondary">
              {t("login.logout")}
            </button>
          )}
        </div>
      ) : (
        <>
          <h2 className="mb-2 text-lg font-bold">{t("login.title")}</h2>
          <form className="grid gap-3" onSubmit={handleSave}>
            <div>
              <label className="label" htmlFor="name">{t("login.name")}</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Filipo Fan"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">{t("login.email")}</label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-describedby="privacy-help"
              />
              <span>{t("privacy.consent")}</span>
            </label>
            <p id="privacy-help" className="text-xs text-neutral-400">
              {t("privacy.helper")}
            </p>
            <button type="submit" className="btn btn-primary">
              {t("login.save")}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
