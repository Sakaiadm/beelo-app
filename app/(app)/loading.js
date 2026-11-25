// @arquivo  loading.js: esqueleto mostrado enquanto uma tela carrega.
// @tipo     tela
export default function Carregando() {
  return (
    <main className="estreito" aria-busy="true" aria-label="Carregando">
      <div className="esqueleto" style={{ height: 34, width: '55%' }} />
      <div className="esqueleto" style={{ height: 16, width: '35%' }} />
      {[0, 1, 2, 3].map((i) => <div key={i} className="esqueleto card" style={{ height: 76 }} />)}
    </main>
  );
}
