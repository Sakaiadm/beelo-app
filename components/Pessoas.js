// @arquivo  Pessoas.js: seletor de pessoa (abas) usado nas telas.
// @tipo     componente
import Link from 'next/link';

// Um só seletor de pessoa no app (Raio-X U19 e V5): pílulas com o nome e a cor da pessoa, sempre na mesma ordem.
// itens: [{ id, nome, cor, href?, on }]. Com href vira link; sem href, botão (aoEscolher).
export default function Pessoas({ itens, rotulo = 'Pessoa', aoEscolher, multi }) {
  return (
    <div className="pessoas-pil" role={aoEscolher ? 'group' : 'navigation'} aria-label={rotulo}>
      {itens.map((p) => {
        const conteudo = <>{p.cor !== null && <i style={{ background: p.cor || 'var(--cinza)' }} aria-hidden="true" />}{p.nome}</>;
        return p.href
          ? <Link prefetch={false} key={p.id} href={p.href} className={p.on ? 'on' : ''} aria-current={p.on ? 'page' : undefined}>{conteudo}</Link>
          : <button key={p.id} type="button" className={p.on ? 'on' : ''} role={multi ? 'checkbox' : 'radio'} aria-checked={!!p.on} onClick={() => aoEscolher(p.id)}>{conteudo}</button>;
      })}
    </div>
  );
}
