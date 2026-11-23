// Avatar do grupo: foto redonda (se tiver) ou as iniciais no azul do app, no mesmo padrão das pessoas.
// Iniciais: primeira letra das duas primeiras palavras (ex.: Família Silva = FS); nome de uma palavra só = uma letra.
export function iniciaisGrupo(nome = '') {
  const p = String(nome).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p.length > 1 ? p[0][0] + p[1][0] : p[0][0]).toUpperCase();
}

export default function FamiliaAvatar({ url, nome, tam = 46, cor = '#1a6fe0' }) {
  const estilo = { width: tam, height: tam, borderRadius: '50%', flex: 'none' };
  if (url) return <img src={url} alt="" className="avatar" style={{ ...estilo, objectFit: 'cover', background: 'var(--borda)' }} />;
  return <span className="avatar" style={{ ...estilo, background: cor, fontSize: Math.round(tam * 0.38) }} aria-hidden="true">{iniciaisGrupo(nome)}</span>;
}
