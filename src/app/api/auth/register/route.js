import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

const BCRYPT_ROUNDS = 12;

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

export async function POST(request) {
  // S5 — Rate limiting : 10 tentatives / minute par IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  const { success, remaining } = rateLimit({ key: `register:${ip}`, limit: 10, windowMs: 60_000 });

  if (!success) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie dans une minute." },
      { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const body = await request.json();

    // S4 — Validation avec Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Vérifier si utilisateur existe déjà
    const userExist = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (userExist) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // S6 — Hachage avec coût centralisé (12 rounds)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });

  } catch (error) {
    console.error("[REGISTER_ERROR]", error?.code ?? "UNKNOWN");

    // S4 — Ne pas exposer les détails d'erreur internes au client
    let errorMsg = "Erreur interne au serveur.";
    if (error?.code === "P1001" || error?.code === "P2021") {
      errorMsg = "Impossible de joindre la base de données (lancez 'npx prisma db push').";
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
