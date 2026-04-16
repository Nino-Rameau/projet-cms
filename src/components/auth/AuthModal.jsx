"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    
    // Si c'est l'inscription
    if (!isLogin) {
      const name = formData.get("name");
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        
        if (!res.ok) {
          let errorMsg = "Une erreur est survenue";
          try {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
            if (data.details) console.error("Détails serveur:", data.details);
          } catch {
            errorMsg = await res.text();
          }
          throw new Error(errorMsg);
        }
        
        // Connecter après Inscription
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) setError(result.error);
        else { onClose(); window.location.href = "/dashboard"; }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Si Connexion classique
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      onClose();
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-pb-background border border-pb-border rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-pb-foreground/50 hover:text-pb-foreground"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-pb-foreground">
          {isLogin ? "Connexion" : "Créer un compte"}
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm bg-red-500/10 border border-red-500/50 text-red-500 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Nom</label>
              <input 
                name="name" 
                type="text" 
                required 
                placeholder="Votre nom" 
                className="px-4 py-2 bg-transparent border border-pb-border rounded focus:outline-none focus:ring-2 focus:ring-pb-accent"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="votre@email.com" 
              className="px-4 py-2 bg-transparent border border-pb-border rounded focus:outline-none focus:ring-2 focus:ring-pb-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Mot de passe</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="px-4 py-2 bg-transparent border border-pb-border rounded focus:outline-none focus:ring-2 focus:ring-pb-accent"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 w-full bg-pb-accent text-white font-bold py-2 rounded shadow hover:bg-pb-accent/90 disabled:opacity-50 transition"
          >
            {isLoading ? "Veuillez patienter..." : (isLogin ? "Se connecter" : "S'inscrire")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-pb-foreground/70">
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 font-bold text-pb-accent hover:underline"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}