"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Login via Supabase Auth (email/password). O registo de membros (via código
// de convite do grupo) é um fluxo separado — não incluído nesta etapa por não
// ter sido pedido; a spec já prevê essa tela em separado.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCarregando(false);
    if (error) {
      setErro("Email ou palavra-passe incorretos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white border border-grayLight p-8">
        <h1 className="font-display font-bold text-2xl text-graphite mb-1">Central de Suporte</h1>
        <p className="text-graySecondary text-sm mb-6">Entra com a tua conta da equipa</p>

        <label className="block text-sm font-medium text-graphite mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-grayLight px-3 py-2 mb-4 outline-none focus:border-petrol"
        />

        <label className="block text-sm font-medium text-graphite mb-1">Palavra-passe</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-grayLight px-3 py-2 mb-4 outline-none focus:border-petrol"
        />

        {erro && <p className="text-sm text-amber-700 mb-4">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-xl bg-petrol text-white font-medium py-2.5 disabled:opacity-60"
        >
          {carregando ? "A entrar..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
