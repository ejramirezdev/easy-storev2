import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!session || !isAdminEmail(email || undefined)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

  const settings = await prisma.payphoneSettings.findFirst();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};

  const stringFields = [
    "token",
    "storeId",
    "environment",
    "merchantEmail",
    "merchantName",
    "responseUrl",
  ] as const;
  for (const key of stringFields) {
    if (key in body) {
      let value = body[key] ?? null;
      // Limpiar el token: remover "Bearer " si está incluido y espacios en blanco
      if (key === "token" && value && typeof value === "string") {
        value = value.trim().replace(/^Bearer\s+/i, '') || null;
      }
      data[key] = value;
    }
  }

  const existing = await prisma.payphoneSettings.findFirst();
  const saved = existing
    ? await prisma.payphoneSettings.update({ where: { id: existing.id }, data })
    : await prisma.payphoneSettings.create({ data });

  return NextResponse.json({ ok: true, settings: saved });
}

