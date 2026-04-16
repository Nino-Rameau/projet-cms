"use server"

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// S6 — Coût bcrypt centralisé (aligné avec register/route.js)
const BCRYPT_ROUNDS = 12;

// S7 — Schéma de validation email/profil
const profileSchema = z.object({
  name: z.string().max(120, "Le nom est trop long").optional(),
  email: z.string().email("Format d'email invalide"),
});

export async function updateAccountProfile(formData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/?error=session_expired");
  }

  const name = String(formData.get("name") || "").trim();
  const emailRaw = String(formData.get("email") || "").trim().toLowerCase();

  // S7 — Validation Zod
  const validation = profileSchema.safeParse({ name: name || undefined, email: emailRaw });
  if (!validation.success) {
    const code = validation.error.errors[0].message.includes("email")
      ? "invalid_email"
      : "name_too_long";
    redirect(`/dashboard/setting?profileError=${code}`);
  }

  const { email } = validation.data;

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingByEmail && existingByEmail.id !== session.user.id) {
    redirect("/dashboard/setting?profileError=email_taken");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      email,
    },
  });

  redirect("/dashboard/setting?profileSuccess=updated");
}

export async function updateAccountPassword(formData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/?error=session_expired");
  }

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!newPassword || !confirmPassword) {
    redirect("/dashboard/setting?passwordError=missing_fields");
  }

  if (newPassword.length < 8) {
    redirect("/dashboard/setting?passwordError=too_short");
  }

  if (newPassword !== confirmPassword) {
    redirect("/dashboard/setting?passwordError=confirm_mismatch");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user) {
    redirect("/dashboard/setting?passwordError=user_not_found");
  }

  if (user.password) {
    if (!currentPassword) {
      redirect("/dashboard/setting?passwordError=current_required");
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      redirect("/dashboard/setting?passwordError=current_invalid");
    }
  }

  // S6 — Coût centralisé à 12 rounds
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  redirect("/dashboard/setting?passwordSuccess=updated");
}
