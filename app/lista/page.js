import ListaJogos from "@/app/components/ListaJogos";

export const dynamic = "force-dynamic";

export default function Lista() {
  return (
    <>
      <header className="topo">
        <h1>Lotofácil</h1>
        <p>Todos os jogos gerados</p>
      </header>

      <main>
        <ListaJogos />
      </main>
    </>
  );
}
