import { formaPreset } from '@/lib/avatares';

// Avatar: foto enviada (url), avatar de criança ("preset:k01") ou a inicial do nome sobre a cor da pessoa.
export default function Avatar({ nome = '?', cor = '#1a6fe0', url, avatar, tam = 34, quadrado = false }) {
  const raio = quadrado ? Math.round(tam * 0.3) : '50%';
  const p = formaPreset(typeof avatar === 'string' && avatar.startsWith('preset:') ? avatar.slice(7) : null);
  if (p) return <img src={p.src} alt="" width={tam} height={tam} className="avatar" style={{ width: tam, height: tam, borderRadius: raio, background: 'none' }} />;
  const estilo = { width: tam, height: tam, fontSize: Math.round(tam * 0.42), borderRadius: raio, background: cor };
  if (url) return <img src={url} alt="" className="avatar" style={{ ...estilo, objectFit: 'cover', background: 'var(--borda)' }} />;
  return <span className="avatar" style={estilo} aria-hidden="true">{(nome || '?').trim().slice(0, 1).toUpperCase()}</span>;
}
