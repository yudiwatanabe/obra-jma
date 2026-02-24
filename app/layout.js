export const metadata = {
  title: 'Obra JMA \u2014 Controle Financeiro',
  description: 'Sistema de controle financeiro de obra',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
