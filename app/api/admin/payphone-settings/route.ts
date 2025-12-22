import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-utils";
import { canAccessPayphone } from "@/lib/admin-permissions";

async function requirePayphoneAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  const hasAccess = await canAccessPayphone(session.user.id);
  if (!hasAccess) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requirePayphoneAccess();
  if (!session) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

  const settings = await prisma.payphoneSettings.findFirst();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  const session = await requirePayphoneAccess();
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

