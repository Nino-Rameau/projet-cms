import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    // 1. Validation avec Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message }, 
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // 2. Vérifier si utilisateur existe déjà
    const userExist = await prisma.user.findUnique({
      where: { email },
    });

    if (userExist) {
      return NextResponse.json({ error: "Un compte avec cet email existe déjà" }, { status: 409 });
    }

    // 3. Hachage du MDP
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Création dans la DB
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });

  } catch (error) {
    console.error("ERREUR D'ENREGISTREMENT: ", error);
    
    // Si c'est Prisma qui plante (souvent "connexion refusée" ou "table n'existe pas")
    let errorMsg = "Erreur interne au serveur.";
    if (error?.code === 'P1001' || error?.code === 'P2021') {
      errorMsg = "Impossible de joindre la base de données PostgreSQL ou elle n'est pas synchronisée (lancez 'npx prisma db push').";
    }
    
    return NextResponse.json(
      { error: errorMsg, details: error.message }, 
      { status: 500 }
    );
  }
}
