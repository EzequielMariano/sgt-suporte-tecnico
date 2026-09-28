import type { Metadata } from "next";
import "./globals.css";

// Nome do produto ainda não definido — "Central de Suporte" é um rótulo neutro
// e temporário, fácil de substituir quando houver um nome oficial.
export const metadata: Metadata = {
  title: "Central de Suporte",
  description: "Gestão de casos escalados pela IA para a equipa de suporte",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-ice font-body text-graphite">{children}</body>
    </html>
  );
}
