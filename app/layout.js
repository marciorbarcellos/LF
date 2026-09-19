import "./globals.css";

export const metadata = {
  title: "Lotofácil - Gerador de Jogos",
  description: "Gerador de jogos randômicos para a Lotofácil",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
