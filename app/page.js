import Link from "next/link";
import GeradorJogo from "@/app/components/GeradorJogo";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <header className="topo">
        <h1>Lotofácil</h1>
        <p>Gerador de jogos randômicos</p>
      </header>

      <main>
        <GeradorJogo />

        <p className="aviso">
          App de geração aleatória e conferência
          de resultados de jogos.
        </p>
      </main>
    </>
  );
}
