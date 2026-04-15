"use server"

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function updateAccountProfile(formData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/?error=session_expired");
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/dashboard/setting?profileError=email_required");
  }

  if (name.length > 120) {
    redirect("/dashboard/setting?profileError=name_too_long");
  }

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

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  redirect("/dashboard/setting?passwordSuccess=updated");
}
