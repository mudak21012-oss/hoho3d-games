"use client";

import { useEffect } from "react";

export default function Toast({
  text,
  onClose,
  kind = "info",
}: {
  text: string;
  onClose: () => void;
  kind?: "info" | "error" | "success";
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);
  const styles =
    kind === "success"
      ? "border-green-700 bg-green-900/60"
      : kind === "error"
      ? "border-red-700 bg-red-900/60"
      : "border-neutral-700 bg-neutral-900/60";
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-xl border ${styles} p-3 text-sm`}
      role="status"
      aria-live="assertive"
    >
      {text}
    </div>
  );
}
