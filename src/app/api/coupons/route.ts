import { NextRequest, NextResponse } from "next/server";
import { fetchCouponsFor } from "@/lib/coupons";
import crypto from "crypto";

export const runtime = "nodejs"; // para usar crypto de Node

type Body = {
  email: string;
  level: "inicial" | "media" | "alta";
  sendEmail?: boolean;
};

async function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Opcional: Vercel KV vía REST (Upstash)
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key: string) {
  if (!KV_URL || !KV_TOKEN) return null;
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}?token=${KV_TOKEN}`);
  const j = await r.json().catch(() => null);
  return j?.result ?? null;
}

async function kvSet(key: string, value: string, ttlSec?: number) {
  if (!KV_URL || !KV_TOKEN) return false;
  const url = new URL(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`);
  url.searchParams.set("token", KV_TOKEN);
  if (ttlSec) url.searchParams.set("ex", String(ttlSec));
  const r = await fetch(url);
  const j = await r.json().catch(() => null);
  return j?.result === "OK";
}

// Opcional: enviar correo con Resend (sin dependencia)
async function sendEmail(to: string, code: string, level: string, type?: string) {
  const API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM || "Hoho3D <no-reply@hoho3d.local>";
  if (!API_KEY) return { sent: false };
  const subject = `Tu premio Hoho3D (${level})`;
  const html = `<div style="font-family:Arial,sans-serif">
    <h2>🎁 Tu código Hoho3D</h2>
    <p>¡Felicitaciones! Aquí está tu premio:</p>
    <p><strong>Código:</strong> ${code}</p>
    ${type ? `<p><strong>Tipo:</strong> ${type}</p>` : ""}
    <p>¡Gracias por jugar con Filipo!</p>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject,
      html,
      text: `Código: ${code}${type ? ` | Tipo: ${type}` : ""}`,
    }),
  });
  if (!res.ok) {
    const msg = await res.text();
    console.error("Resend error:", msg);
    return { sent: false, error: msg };
  }
  return { sent: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.email || !body?.level) {
      return NextResponse.json({ error: "Missing email or level" }, { status: 400 });
    }
    const email = String(body.email).trim().toLowerCase();
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const emailHash = await sha256Hex(email);

    // Evitar duplicados por usuario y nivel (si KV disponible)
    const userLevelKey = `user:${emailHash}:${body.level}`;
    const already = await kvGet(userLevelKey);
    if (already) {
      return NextResponse.json(
        { error: "already-claimed", code: already },
        { status: 409 }
      );
    }

    // Buscar cupón en CSV (filtra por semana actual y nivel)
    const coupon = await fetchCouponsFor(body.level);
    if (!coupon) {
      return NextResponse.json(
        { error: "out-of-stock" },
        { status: 404 }
      );
    }

    // Si KV disponible, marcar cupón como usado
    const couponKey = `coupon:${coupon.code}`;
    await kvSet(couponKey, emailHash, 60 * 60 * 24 * 30); // 30 días
    await kvSet(userLevelKey, coupon.code, 60 * 60 * 24 * 30);

    // Opcional: enviar por correo
    if (body.sendEmail) {
      await sendEmail(email, coupon.code, body.level, coupon.type);
    }

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type || null,
      level: body.level,
      week: coupon.week || null,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "server-error", message: e?.message || "Unknown" },
      { status: 500 }
    );
  }
}
