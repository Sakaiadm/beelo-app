'use client';
import Icone from './Icone';
import { useState } from 'react';
import Link from 'next/link';
import Form from './Form';
import AvatarUpload from './AvatarUpload';
import Avatar from './Avatar';
import { salvarPessoa, excluirPessoa } from '@/app/acoes';
import { validarEmail } from '@/lib/email';
import { FUNCOES, funcaoDe, chavesIniciais, rotuloFuncao } from '@/lib/papeis';
import { CORES_PESSOA } from '@/lib/cores';
import { statusConvite } from '@/lib/statusConvite';
import ReenviarConvite from './ReenviarConvite';

export default function PessoaForm({ m, familia, url, corInicial, usadas = [], euId }) {
  const [nome, setNome] = useState(m?.nome || '');
  const [email, setEmail] = useState(m?.email || '');
  const [funcao, setFuncao] = useState(m?.funcao || (m ? (m.papel === 'gestor' ? 'pai' : 'filho') : ''));
  const [cor, setCor] = useState(m?.cor || corInicial || '#1a6fe0');
  const [ativo, setAtivo] = useState(m ? m.ativo : true);
  const [tela, setTela] = useState(m ? m.tela_ativo : true);
  const [crianca, setCrianca] = useState(!!m?.modo_crianca);
  const [chaves, setChaves] = useState(chavesIniciais(m?.funcao || (m ? (m.papel === 'gestor' ? 'pai' : 'filho') : ''), m?.permissoes));
  const [folha, setFolha] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const v = validarEmail(email);
  const f = funcaoDe(funcao);
  const mudaFuncao = (id) => { setFuncao(id); setChaves(chavesIniciais(id, null)); };
  const eu = m && m.id === euId;
  const bloqueado = (email && !v.ok) || !nome.trim() || !funcao;
  // Pessoa nova com e-mail válido: um botão só, que salva e já manda o convite.
  const convidar = !m && !!email && v.ok;
  const usadasMin = usadas.map((c) => String(c).toLowerCase());
  return (
    <>
      <Form acao={salvarPessoa} okTxt="Salvo." limpar={!m} className="card">
        {m && <input type="hidden" name="id" value={m.id} />}
        <input type="hidden" name="funcao" value={funcao} />
        <input type="hidden" name="cor" value={cor} />
        {ativo && <input type="hidden" name="ativo" value="1" />}
        {tela && <input type="hidden" name="tela_ativo" value="1" />}
        {crianca && <input type="hidden" name="modo_crianca" value="1" />}
        {Object.entries(chaves).map(([k, on]) => on && <input key={k} type="hidden" name={`perm_${k}`} value="1" />)}
        {m ? (
          <div style={{ marginBottom: 12 }}><AvatarUpload familia={familia} pasta={m.id} atualUrl={url} atualAvatar={m.avatar} rotulo={nome || m.nome} cor={cor} /></div>
        ) : (
          <div className="cartao-l" style={{ marginBottom: 12 }}><Avatar nome={nome || '?'} cor={cor} tam={42} /><span><b>{nome || 'Nova pessoa'}</b><small className="peq-cinza">{f ? rotuloFuncao(f.id, null) : 'Escolha o papel'}</small></span></div>
        )}
        <label htmlFor="p-nome">Nome</label>
        <input id="p-nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={60} placeholder="Ex.: Tia Ana" />
        <label htmlFor="p-email">E-mail Google</label>
        <div className={`campo-ok ${email ? (v.ok ? 'ok' : 'erro') : ''}`}>
          <input id="p-email" type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} name="email" value={email}
            onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))} onBlur={() => setEmail(v.email || '')} placeholder="nome@gmail.com" />
          {email && v.ok && <span className="certo" aria-label="E-mail válido">✓</span>}
        </div>
        {email && !v.ok && <p className="erro-campo" role="alert">{v.msg}</p>}
        {v.ok && v.sugestao && <p className="sug-campo">Você quis dizer <button type="button" onClick={() => setEmail(v.sugestao)}>{v.sugestao}</button>? Toque para corrigir.</p>}
        <label htmlFor="p-papel">Papel</label>
        <select id="p-papel" value={funcao} onChange={(e) => mudaFuncao(e.target.value)} required>
          <option value="" disabled>Selecione</option>
          {FUNCOES.map((x) => <option key={x.id} value={x.id}>{x.ga ? `${x.nome}(a)` : x.nome}</option>)}
        </select>
        {f && (
          <>
            <div className="caixa-papel"><b>{rotuloFuncao(f.id, null)}:</b> {f.desc}</div>
            {f.chaves.length > 0 && (
              <>
                <p className="peq-cinza" style={{ margin: '12px 0 2px' }}>O que ele pode fazer</p>
                {f.chaves.map(([k, t]) => (
                  <div className="lin-chave" key={k}><span>{t}</span>
                    <button type="button" role="switch" aria-checked={!!chaves[k]} aria-label={t} className={`chave ${chaves[k] ? 'on' : ''}`} onClick={() => setChaves((x) => ({ ...x, [k]: !x[k] }))} />
                  </div>
                ))}
                <p className="peq-cinza">As chaves ficam guardadas e passam a valer em uma próxima atualização do app.</p>
              </>
            )}
          </>
        )}
        <button type="button" className="campo-botao" style={{ marginTop: 14 }} onClick={() => setFolha(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="bolinha-cor" style={{ background: cor }} />Cor da pessoa</span><span aria-hidden="true">›</span>
        </button>
        {f && f.papel !== 'gestor' && (
          <div className="lin-chave"><span>Modo criança<small>Ao concluir: mensagem alegre e estrelinhas. Bom para até uns 10 anos.</small></span><button type="button" role="switch" aria-checked={crianca} aria-label="Modo criança" className={`chave ${crianca ? 'on' : ''}`} onClick={() => setCrianca(!crianca)} /></div>
        )}
        <div className="lin-chave"><span>Tempo de tela ligado</span><button type="button" role="switch" aria-checked={tela} aria-label="Tempo de tela ligado" className={`chave ${tela ? 'on' : ''}`} onClick={() => setTela(!tela)} /></div>
        <div className="lin-chave"><span>Acesso ativo<small>{eu ? 'Você não pode desativar a si mesmo' : 'Desativar tira o acesso sem apagar o histórico'}</small></span><button type="button" role="switch" aria-checked={ativo} aria-label="Acesso ativo" disabled={eu} className={`chave ${ativo ? 'on' : ''}`} onClick={() => setAtivo(!ativo)} /></div>
        {m && <p className="peq-cinza">{m.user_id ? 'Já entrou no app' : m.email ? 'Convite pendente' : 'Sem e-mail: não consegue entrar'}</p>}
        {convidar && <input type="hidden" name="enviar" value="1" />}
        <button className="btn bloco" style={{ marginTop: 12 }} disabled={bloqueado}>{m ? 'Salvar' : convidar ? 'Salvar e enviar convite' : 'Adicionar pessoa'}</button>
        {!m && <p className="peq-cinza">A foto pode ser colocada depois de salvar. Para mandar o convite, digite o e-mail e toque em Salvar e enviar convite.</p>}
        {folha && (
          <div className="folha" role="dialog" aria-modal="true" aria-label="Cor">
            <div className="folha-in">
              <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setFolha(false)}><Icone nome="esq" tam={26} /></button><h2>Cor</h2></div>
              <div className="cartao-l"><Avatar nome={nome || '?'} cor={cor} tam={42} /><span><b>{nome || 'Nova pessoa'}</b><small className="peq-cinza">{f ? rotuloFuncao(f.id, null) : ''}</small></span></div>
              <p style={{ fontWeight: 700, margin: '4px 0 0' }}>Cores sugeridas</p>
              <div className="grade-cores">
                {CORES_PESSOA.map((c) => (
                  <button key={c} type="button" aria-label={`Cor ${c}`} aria-pressed={cor.toLowerCase() === c} className={`${cor.toLowerCase() === c ? 'sel' : ''} ${usadasMin.includes(c) && cor.toLowerCase() !== c ? 'usada' : ''}`} style={{ background: c }} onClick={() => setCor(c)} />
                ))}
              </div>
              <label className="campo-botao" style={{ cursor: 'pointer' }}><span>Outra cor<small className="peq-cinza" style={{ display: 'block' }}>Abre a paleta completa</small></span>
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(cor) ? cor : '#1a6fe0'} onChange={(e) => setCor(e.target.value)} style={{ width: 44, height: 36, padding: 0, border: 0, background: 'none' }} aria-label="Escolher qualquer cor" /></label>
              <button type="button" className="btn bloco" onClick={() => setFolha(false)}>Usar esta cor</button>
            </div>
          </div>
        )}
      </Form>
      {m && m.email && !eu && (m.user_id ? (
        <div className="card">
          <b>Problemas para entrar?</b>
          <p style={{ margin: '6px 0 12px', fontSize: 14, color: 'var(--cinza)', lineHeight: 1.45 }}>Se {m.nome} trocou de celular ou perdeu o link, mande um novo e-mail de acesso para o e-mail cadastrado.</p>
          <ReenviarConvite id={m.id} rotulo="Enviar e-mail de acesso" />
        </div>
      ) : (
        <div className="card">
          <b>Convite por e-mail</b>
          <p style={{ margin: '6px 0 10px', fontSize: 14, color: 'var(--cinza)' }}>{statusConvite(m)?.txt}</p>
          <ReenviarConvite id={m.id} rotulo={m.convidado_em ? 'Reenviar convite' : 'Enviar convite'} />
        </div>
      ))}
      {m && !eu && (
        <div className="card">
          {!excluir ? (
            <button type="button" className="btn perigo sec" onClick={() => setExcluir(true)}>Excluir pessoa</button>
          ) : (
            <form action={excluirPessoa}>
              <input type="hidden" name="id" value={m.id} />
              <p style={{ margin: '0 0 10px' }}>Excluir <b>{m.nome}</b> apaga também as tarefas e o histórico dela. Se só quiser tirar o acesso, desligue “Acesso ativo”.</p>
              <div className="acoes"><button className="btn perigo">Sim, excluir</button><button type="button" className="btn sec" onClick={() => setExcluir(false)}>Cancelar</button></div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
