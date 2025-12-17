import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar todas las cuentas bancarias
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const accounts = await prisma.bankAccount.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Error obteniendo cuentas bancarias:", error);
    return NextResponse.json(
      { error: error?.message || "Error obteniendo cuentas bancarias" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva cuenta bancaria
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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
    if (!bankName || !accountType || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (!["SAVINGS", "CHECKING"].includes(accountType)) {
      return NextResponse.json(
        { error: "Tipo de cuenta inválido" },
        { status: 400 }
      );
    }

    const account = await prisma.bankAccount.create({
      data: {
        bankName,
        accountType,
        accountNumber,
        accountHolder,
        idNumber: idNumber || null,
        email: email || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ account });
  } catch (error: any) {
    console.error("Error creando cuenta bancaria:", error);
    return NextResponse.json(
      { error: error?.message || "Error creando cuenta bancaria" },
      { status: 500 }
    );
  }
}

