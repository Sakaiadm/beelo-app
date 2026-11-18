import { formaPreset } from '@/lib/avatares';

function Moderno({ id, a, b, forma, tam, quadrado }) {
  const g = `g-${id}-${tam}`;
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" className="avatar" style={{ borderRadius: quadrado ? '30%' : '50%', background: 'none' }} aria-hidden="true">
      <defs><linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
        <clipPath id={`c-${g}`}><rect width="40" height="40" rx={quadrado ? 12 : 20} /></clipPath></defs>
      <g clipPath={`url(#c-${g})`}>
        <rect width="40" height="40" fill={`url(#${g})`} />
        {forma === 'circulo' && <circle cx="27" cy="13" r="11" fill="#fff" opacity=".28" />}
        {forma === 'triangulo' && <path d="M4 38 22 6l16 32Z" fill="#fff" opacity=".28" />}
        {forma === 'ondas' && <><path d="M0 24c7-8 13 8 20 0s13 8 20 0v16H0Z" fill="#fff" opacity=".3" /><path d="M0 14c7-8 13 8 20 0s13 8 20 0" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" /></>}
        {forma === 'aneis' && <><circle cx="20" cy="20" r="14" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" /><circle cx="20" cy="20" r="6" fill="#fff" opacity=".5" /></>}
        {forma === 'metade' && <path d="M0 40V20a20 20 0 0 1 40 0v20Z" fill="#fff" opacity=".28" />}
        {forma === 'quadrado' && <rect x="9" y="9" width="22" height="22" rx="5" transform="rotate(20 20 20)" fill="#fff" opacity=".32" />}
      </g>
    </svg>
  );
}

// Avatar: foto enviada (url), avatar pronto ("preset:m1") ou a inicial do nome sobre a cor da pessoa.
export default function Avatar({ nome = '?', cor = '#1a6fe0', url, avatar, tam = 34, quadrado = false }) {
  const raio = quadrado ? Math.round(tam * 0.3) : '50%';
  const p = formaPreset(typeof avatar === 'string' && avatar.startsWith('preset:') ? avatar.slice(7) : null);
  if (p?.tipo === 'm') return <Moderno id={avatar} {...p} tam={tam} quadrado={quadrado} />;
  if (p?.tipo === 'd') return <span className="avatar" style={{ width: tam, height: tam, fontSize: Math.round(tam * 0.55), borderRadius: raio, background: p.fundo }} aria-hidden="true">{p.emoji}</span>;
  const estilo = { width: tam, height: tam, fontSize: Math.round(tam * 0.42), borderRadius: raio, background: cor };
  if (url) return <img src={url} alt="" className="avatar" style={{ ...estilo, objectFit: 'cover', background: 'var(--borda)' }} />;
  return <span className="avatar" style={estilo} aria-hidden="true">{(nome || '?').trim().slice(0, 1).toUpperCase()}</span>;
}
