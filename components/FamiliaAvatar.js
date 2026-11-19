import Icone from './Icone';

// Avatar da família: foto (se tiver) ou o ícone de pessoas juntas sobre a cor.
export default function FamiliaAvatar({ url, tam = 46, cor = '#7b61d1' }) {
  const estilo = { width: tam, height: tam, borderRadius: Math.round(tam * 0.26), flex: 'none' };
  if (url) return <img src={url} alt="" style={{ ...estilo, objectFit: 'cover', background: 'var(--borda)' }} />;
  return <span style={{ ...estilo, background: cor, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true"><Icone nome="familia" tam={Math.round(tam * 0.52)} /></span>;
}
