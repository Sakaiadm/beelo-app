'use client';
import Icone from './Icone';
import Avatar from './Avatar';
import { CORES_PESSOA } from '@/lib/cores';

// Folha de escolher cor (pessoa ou grupo): cores sugeridas + paleta completa.
export default function CorFolha({ cor, setCor, fechar, titulo = 'Cor', topo, usadas = [] }) {
  const usadasMin = usadas.map((c) => String(c).toLowerCase());
  return (
    <div className="folha" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="folha-in">
        <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={fechar}><Icone nome="esq" tam={26} /></button><h2>{titulo}</h2></div>
        {topo}
        <p style={{ fontWeight: 700, margin: '4px 0 0' }}>Cores sugeridas</p>
        <div className="grade-cores">
          {CORES_PESSOA.map((c) => (
            <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={cor.toLowerCase() === c} className={`${cor.toLowerCase() === c ? 'sel' : ''} ${usadasMin.includes(c) && cor.toLowerCase() !== c ? 'usada' : ''}`} style={{ background: c }} onClick={() => setCor(c)} />
          ))}
        </div>
        <label className="campo-botao" style={{ cursor: 'pointer' }}><span>Outra cor<small className="peq-cinza" style={{ display: 'block' }}>Abre a paleta completa</small></span>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(cor) ? cor : '#1a6fe0'} onChange={(e) => setCor(e.target.value)} style={{ width: 44, height: 36, padding: 0, border: 0, background: 'none' }} aria-label="Escolher qualquer cor" /></label>
        <button type="button" className="btn bloco" onClick={fechar}>Usar esta cor</button>
      </div>
    </div>
  );
}

// Linha "Cor da pessoa" / "Minha cor" / "Cor do grupo" que abre a folha.
export function CorBotao({ cor, rotulo, onClick, style }) {
  return (
    <button type="button" className="campo-botao" style={style} onClick={onClick}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="bolinha-cor" style={{ background: cor }} />{rotulo}</span><span aria-hidden="true">›</span>
    </button>
  );
}
