import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin-utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PUT - Actualizar cuenta bancaria
export async function PUT(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const {
      bankName,
      accountType,
      accountNumber,
      accountHolder,
      idNumber,
      email,
      isActive,
      sortOrder,
    } = body;

    // Validaciones
    if (accountType && !["SAVINGS", "CHECKING"].includes(accountType)) {
      return NextResponse.json(
        { error: "Tipo de cuenta inválido" },
        { status: 400 }
      );
    }

    const account = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(bankName !== undefined && { bankName }),
        ...(accountType !== undefined && { accountType }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(accountHolder !== undefined && { accountHolder }),
        ...(idNumber !== undefined && { idNumber: idNumber || null }),
        ...(email !== undefined && { email: email || null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ account });
  } catch (error: any) {
    console.error("Error actualizando cuenta bancaria:", error);
    return NextResponse.json(
      { error: error?.message || "Error actualizando cuenta bancaria" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cuenta bancaria
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error eliminando cuenta bancaria:", error);
    return NextResponse.json(
      { error: error?.message || "Error eliminando cuenta bancaria" },
      { status: 500 }
    );
  }
}

