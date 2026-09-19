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
          A Lotofácil é um jogo de loteria genuinamente aleatório. Nenhum algoritmo garante ou aumenta a
          probabilidade real de acerto dos 15 números — este app oferece geração aleatória e conferência
          de resultados como ferramenta de organização de jogos, não como previsão de resultado.
        </p>
      </main>
    </>
  );
}
