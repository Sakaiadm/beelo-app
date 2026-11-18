// Avatar redondo: imagem, se houver, ou a inicial do nome sobre a cor da pessoa.
export default function Avatar({ nome = '?', cor = '#1a6fe0', url, tam = 34, quadrado = false }) {
  const estilo = { width: tam, height: tam, fontSize: Math.round(tam * 0.42), borderRadius: quadrado ? Math.round(tam * 0.3) : '50%', background: cor };
  if (url) return <img src={url} alt="" className="avatar" style={{ ...estilo, objectFit: 'cover', background: 'var(--borda)' }} />;
  return <span className="avatar" style={estilo} aria-hidden="true">{(nome || '?').trim().slice(0, 1).toUpperCase()}</span>;
}
