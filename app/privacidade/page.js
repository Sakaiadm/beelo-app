export const metadata = { title: 'Privacidade · Rotina Ativa' };
export default function Privacidade() {
  return (
    <main className="estreito">
      <h1 className="titulo">Privacidade</h1>
      <div className="card" style={{ marginTop: 16, lineHeight: 1.6, fontSize: 15 }}>
        <p>O Rotina Ativa é usado só pela nossa família. Os dados (tarefas, horários, tempo de tela e fotos) ficam guardados no Supabase, com acesso restrito por pessoa, e nunca são compartilhados com terceiros nem usados para anúncios.</p>
        <p>Os pais respondem pelos dados de filhos menores de idade, conforme a LGPD. Guardamos o mínimo necessário. As fotos ficam privadas, sem localização, e são apagadas depois de 90 dias.</p>
        <p>Qualquer membro pode pedir aos pais a exportação ou a exclusão dos seus dados.</p>
        <p><a href="/">Voltar</a></p>
      </div>
    </main>
  );
}
