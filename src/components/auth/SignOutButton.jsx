
"use client"
import { signOut } from "next-auth/react";
export function SignOutButton() {
  return <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs font-bold text-red-500 hover:text-red-600 transition tracking-wider border border-red-500/20 px-3 py-1.5 rounded-md hover:bg-red-500/10">Déconnexion</button>;
}
