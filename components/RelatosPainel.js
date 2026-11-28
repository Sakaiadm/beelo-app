'use client';
// @arquivo  RelatosPainel.js: lista dos relatos dos testadores com caixinha de marcar e gerador de prompt para colar no Claude.
// @tipo     componente
// @usa      components/Form, components/Icone, components/ImagemMarcar (lápis), app/acoes.js (mudarRelato)
// @usado-por app/(app)/config/relatos/page.js
// @decisao  27/11 Thomas: marcar relatos, lápis na imagem, observação em cada um e "+ Pedir algo" (pedidos do próprio Thomas) → prompt pronto com "Copiar", no padrão dos painéis de escolha.
// @cuidado  a imagem do relato NÃO vai dentro do prompt (link privado vence em 1h): o prompt avisa que há imagem e o Thomas anexa ao colar.
import { useState } from 'react';
import Form from './Form';
import Icone from './Icone';
import ImagemMarcar from './ImagemMarcar';
import { mudarRelato } from '@/app/acoes';

const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function montarPrompt(itens, obs, pedidos, marcas) {
  const blocos = itens.map((r, i) => [
    `RELATO ${i + 1}: ${r.tipo === 'problema' ? 'PROBLEMA' : 'SUGESTÃO'}`,
    `Quem: ${r.nome || 'testador'} (${r.papel || 'perfil não informado'}), ${r.familia} · ${quando(r.criado_em)}`,
    `Tela: ${r.tela || 'não informada'}`,
    `Aparelho: ${r.aparelho || 'não informado'}`,
    `O que escreveu: ${r.texto}`,
    r.foto_path ? 'Imagem: o testador anexou uma imagem (vou anexar junto a este prompt).' : 'Imagem: sem imagem.',
    ...(marcas[r.id]?.descricao?.length ? ['Eu marquei na imagem, com lápis vermelho e números (a imagem marcada vai anexada):', ...marcas[r.id].descricao.map((d) => `- ${d}`)] : []),
    obs[r.id]?.trim() ? `O que eu quero (Thomas): ${obs[r.id].trim()}` : '',
  ].filter(Boolean).join('\n'));
  const meus = pedidos.map((x) => x.trim()).filter(Boolean).map((x, i) => `PEDIDO MEU ${i + 1}: ${x}`);
  return [
    'Claude, estes são relatos de testadores do beelo (repositório Sakaiadm/beelo-app). Leia o CLAUDE.md e os docs/ antes de mexer.',
    'Para cada relato e pedido: confirme a causa no código (ou, se for sugestão, diga se cabe no app), proponha a solução e mostre uma PRÉVIA no app real, modo claro, com os elementos que o app já usa. Não aplique nada até eu dizer "pode aplicar".',
    '',
    [...blocos, ...meus].join('\n\n'),
  ].join('\n').trim();
}

export default function RelatosPainel({ lista, fotos }) {
  const [marcados, setMarcados] = useState([]);
  const [obs, setObs] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [marcas, setMarcas] = useState({}); // por relato: { tracos, descricao[], url }
  const [editando, setEditando] = useState(null); // relato aberto no lápis
  const [falhou, setFalhou] = useState({}); // imagens que não carregaram
  const [prompt, setPrompt] = useState('');
  const [copiado, setCopiado] = useState(false);
  const alternar = (id) => { setPrompt(''); setCopiado(false); setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id])); };
  const mexeu = () => { setPrompt(''); setCopiado(false); };
  const temPedido = pedidos.some((x) => x.trim());
  // Um botão só: gera o prompt e já copia (o texto fica na tela para conferir).
  async function gerarECopiar() {
    const texto = montarPrompt(lista.filter((r) => marcados.includes(r.id)), obs, pedidos, marcas);
    setPrompt(texto);
    try { await navigator.clipboard.writeText(texto); setCopiado(true); }
    catch { setCopiado(false); setTimeout(() => { const t = document.getElementById('prompt-relatos'); t?.focus(); t?.select(); }, 50); }
  }
  return (
    <>
      {editando && (
        <ImagemMarcar src={fotos[lista.find((r) => r.id === editando)?.foto_path]} tracosIniciais={marcas[editando]?.tracos || []} fechar={() => setEditando(null)}
          aoPronto={(m) => { setMarcas((x) => ({ ...x, [editando]: m })); if (!marcados.includes(editando)) setMarcados((l) => [...l, editando]); setEditando(null); setPrompt(''); setCopiado(false); }} />
      )}
      {!lista.length && <p className="peq-cinza">Nada por aqui.</p>}
      {lista.map((r) => (
        <article key={r.id} className="card" style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, marginBottom: 10 }}>
            <input type="checkbox" checked={marcados.includes(r.id)} onChange={() => alternar(r.id)} />Incluir no prompt
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <span className={`tg ${r.tipo === 'problema' ? '' : 'cz'}`}>{r.tipo === 'problema' ? 'Problema' : 'Sugestão'}</span>
            <b>{r.nome}</b><small className="peq-cinza">{r.familia} · {quando(r.criado_em)}</small>
          </div>
          <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{r.texto}</p>
          {fotos[r.foto_path] && !falhou[r.id] && (
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setEditando(r.id)} aria-label="Ampliar a imagem e marcar com o lápis" style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'none', cursor: 'pointer' }}>
                <img src={marcas[r.id]?.url || fotos[r.foto_path]} alt="Imagem anexada ao relato" onError={() => setFalhou((f) => ({ ...f, [r.id]: true }))} style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--borda)', background: 'var(--fundo)', display: 'block' }} />
              </button>
              <span className="icone-btn" aria-hidden="true" style={{ position: 'absolute', right: 8, bottom: 8, background: '#1a6fe0', pointerEvents: 'none' }}><Icone nome="lapis" tam={18} cor="#fff" /></span>
              {marcas[r.id]?.descricao?.length > 0 && <span className="tg" style={{ position: 'absolute', left: 8, top: 8, background: '#2c9a5b', color: '#fff', pointerEvents: 'none' }}>✓ Marcação salva</span>}
            </div>
          )}
          {fotos[r.foto_path] && falhou[r.id] && <p className="peq-cinza" style={{ margin: '4px 0' }}>Não foi possível carregar a imagem deste relato.</p>}
          {marcas[r.id]?.descricao?.length > 0 && (
            <p className="peq-cinza" style={{ margin: '6px 0 0' }}>{marcas[r.id].descricao.length} {marcas[r.id].descricao.length === 1 ? 'marcação feita' : 'marcações feitas'}.{marcas[r.id].url && <> <a href={marcas[r.id].url} download={`relato-marcado-${r.id.slice(0, 6)}.jpg`}>Baixar imagem marcada</a></>}</p>
          )}
          <p className="peq-cinza" style={{ margin: '8px 0' }}>Tela: {r.tela} · {r.papel} · {r.aparelho}</p>
          {marcados.includes(r.id) && (
            <label style={{ display: 'block', fontWeight: 700, margin: '4px 0 10px' }}>O que eu quero <small className="peq-cinza" style={{ fontWeight: 400 }}>(opcional)</small>
              <textarea value={obs[r.id] || ''} onChange={(e) => { setObs({ ...obs, [r.id]: e.target.value }); mexeu(); }} rows={2} maxLength={800} placeholder="Detalhe ou observação sua sobre este relato…" style={{ marginTop: 6, fontWeight: 400 }} />
            </label>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            {r.status !== 'visto' && <Form simples acao={mudarRelato}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="visto" /><button className="btn sec peq">Marcar como visto</button></Form>}
            {r.status !== 'resolvido' && <Form simples acao={mudarRelato}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="resolvido" /><button className="btn peq">Resolvido</button></Form>}
            {r.status !== 'novo' && <Form simples acao={mudarRelato}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="novo" /><button className="btn sec peq">Voltar para novos</button></Form>}
          </div>
        </article>
      ))}
      {lista.length > 0 && (
        <section className="card" aria-label="Gerar prompt">
          <h2>Prompt para o Claude</h2>
          <p className="peq-cinza" style={{ margin: '0 0 10px' }}>{marcados.length ? `${marcados.length} ${marcados.length === 1 ? 'relato marcado' : 'relatos marcados'}.` : 'Marque os relatos que quer levar.'} Você também pode pedir algo seu, que não veio de testador.</p>
          {pedidos.map((x, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><b>Pedido meu {i + 1}</b>
                <button type="button" className="folha-volta" aria-label={`Tirar o pedido ${i + 1}`} onClick={() => { setPedidos(pedidos.filter((_, j) => j !== i)); mexeu(); }}><Icone nome="x" tam={20} /></button></div>
              <textarea value={x} onChange={(e) => { setPedidos(pedidos.map((y, j) => (j === i ? e.target.value : y))); mexeu(); }} rows={3} maxLength={1500} placeholder="Escreva o que você quer mudar ou criar…" />
            </div>
          ))}
          <button type="button" className="btn sec peq" onClick={() => { setPedidos([...pedidos, '']); mexeu(); }}><Icone nome="mais" tam={18} />Pedir algo</button>
          <button type="button" className="btn bloco" style={{ marginTop: 12 }} disabled={!marcados.length && !temPedido} onClick={gerarECopiar}>{copiado ? 'Prompt copiado! Gerar de novo' : 'Gerar e copiar prompt'}</button>
          {prompt && (
            <div style={{ marginTop: 12 }}>
              <textarea id="prompt-relatos" readOnly value={prompt} rows={10} aria-label="Prompt pronto" style={{ fontSize: 'var(--f-apoio)' }} />
              <p className="peq-cinza" style={{ margin: '8px 0 0' }}>{copiado ? 'Copiado. ' : 'Não copiou sozinho: o texto está selecionado, é só copiar. '}Cole no chat do projeto e anexe as imagens (use “Baixar imagem marcada” nos relatos com marcação).</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
