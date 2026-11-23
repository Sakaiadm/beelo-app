'use client';
import { useState } from 'react';
import Link from 'next/link';
import Form from './Form';
import AvatarUpload from './AvatarUpload';
import Avatar from './Avatar';
import { salvarPessoa, excluirPessoa } from '@/app/acoes';
import { validarEmail } from '@/lib/email';
import { FUNCOES, funcaoDe, chavesIniciais, rotuloFuncao, nomeFuncao, temModoCrianca } from '@/lib/papeis';
import CorFolha, { CorBotao } from './CorFolha';
import { statusConvite } from '@/lib/statusConvite';
import ReenviarConvite from './ReenviarConvite';
import ConfirmarBotao from './ConfirmarBotao';
import RepetirCampo, { opcaoDaTarefa } from './RepetirCampo';

export default function PessoaForm({ m, familia, url, corInicial, usadas = [], euId, existentes = [], telaTarefa, hoje }) {
  const [nome, setNome] = useState(m?.nome || '');
  const [email, setEmail] = useState(m?.email || '');
  const [funcao, setFuncao] = useState(m?.funcao || (m ? (m.papel === 'gestor' ? 'pai' : 'filho') : ''));
  const [cor, setCor] = useState(m?.cor || corInicial || '#1a6fe0');
  const [ativo, setAtivo] = useState(m ? m.ativo : true);
  const [tela, setTela] = useState(m ? m.tela_ativo : false);
  const [crianca, setCrianca] = useState(!!m?.modo_crianca);
  const [chaves, setChaves] = useState(chavesIniciais(m?.funcao || (m ? (m.papel === 'gestor' ? 'pai' : 'filho') : ''), m?.permissoes));
  const [folha, setFolha] = useState(false);
  const v = validarEmail(email);
  const f = funcaoDe(funcao);
  const mudaFuncao = (id) => { setFuncao(id); setChaves(chavesIniciais(id, null)); };
  const eu = m && m.id === euId;
  // Em "Adicionar pessoa", o e-mail digitado já é de alguém deste grupo (ex.: o responsável
  // cadastrado junto com o grupo): não dá erro, o botão só manda o convite para essa pessoa.
  const ja = !m && v.ok ? existentes.find((x) => x.email && x.email.toLowerCase() === v.email) : null;
  const bloqueado = !ja && ((email && !v.ok) || !nome.trim() || !funcao);
  // Pessoa nova com e-mail válido: um botão só, que salva e já manda o convite.
  const convidar = !m && !!email && v.ok;
  const rotuloJa = ja ? (ja.user_id ? 'Enviar e-mail de acesso' : ja.convidado_em ? 'Reenviar convite' : 'Enviar convite') : '';
  const crianca2 = crianca && temModoCrianca(funcao);
  // Campo Nome ao lado da foto (mesmo padrão para adulto e criança).
  const campoNome = (
    <>
      <label htmlFor="p-nome" style={{ marginTop: 0 }}>Nome</label>
      <input id="p-nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required={!ja} maxLength={60} placeholder="Ex.: Tia Ana" />
    </>
  );
  return (
    <>
      <Form acao={salvarPessoa} okTxt="Salvo." limpar={!m} className="card">
        {m && <input type="hidden" name="id" value={m.id} />}
        <input type="hidden" name="funcao" value={funcao} />
        <input type="hidden" name="cor" value={cor} />
        {ativo && <input type="hidden" name="ativo" value="1" />}
        {tela && <input type="hidden" name="tela_ativo" value="1" />}
        {crianca2 && <input type="hidden" name="modo_crianca" value="1" />}
        {Object.entries(chaves).map(([k, on]) => on && <input key={k} type="hidden" name={`perm_${k}`} value="1" />)}
        {m ? (
          <AvatarUpload familia={familia} pasta={m.id} atualUrl={url} atualAvatar={m.avatar} rotulo={nome || m.nome} cor={cor} crianca={crianca2} lado={campoNome} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Avatar nome={nome || '?'} cor={cor} tam={56} /><div style={{ flex: 1, minWidth: 0 }}>{campoNome}</div></div>
        )}
        <CorBotao cor={cor} rotulo="Cor da pessoa" style={{ marginTop: 14 }} onClick={() => setFolha(true)} />
        <label htmlFor="p-email">E-mail Google</label>
        <div className={`campo-ok ${email ? (v.ok ? 'ok' : 'erro') : ''}`}>
          <input id="p-email" type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} name="email" value={email}
            onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))} onBlur={() => setEmail(v.email || '')} placeholder="nome@gmail.com" />
          {email && v.ok && <span className="certo" aria-label="E-mail válido">✓</span>}
        </div>
        {email && !v.ok && <p className="erro-campo" role="alert">{v.msg}</p>}
        {v.ok && v.sugestao && <p className="sug-campo">Você quis dizer <button type="button" onClick={() => setEmail(v.sugestao)}>{v.sugestao}</button>? Toque para corrigir.</p>}
        <label htmlFor="p-papel">Papel</label>
        <select id="p-papel" value={funcao} onChange={(e) => mudaFuncao(e.target.value)} required={!ja}>
          <option value="" disabled>Selecione</option>
          {FUNCOES.map((x) => <option key={x.id} value={x.id}>{x.ga ? `${x.nome}(a)` : x.nome}</option>)}
        </select>
        {f && (
          <>
            <div className="caixa-papel"><b>{rotuloFuncao(f.id, null)}:</b> {f.desc}</div>
            {temModoCrianca(f.id) && (
              <div className="lin-chave" style={{ borderTop: 0, marginTop: 4 }}><span>Modo criança<small>Estrelinhas e festa a cada tarefa feita. Bom para até uns 10 anos.</small></span><button type="button" role="switch" aria-checked={crianca} aria-label="Modo criança" className={`chave ${crianca ? 'on' : ''}`} onClick={() => setCrianca(!crianca)} /></div>
            )}
            {f.chaves.length > 0 && (
              <>
                <p className="peq-cinza" style={{ margin: '12px 0 2px' }}>O que ele pode fazer</p>
                {f.chaves.map(([k, t]) => (
                  <div className="lin-chave" key={k}><span>{t}</span>
                    <button type="button" role="switch" aria-checked={!!chaves[k]} aria-label={t} className={`chave ${chaves[k] ? 'on' : ''}`} onClick={() => setChaves((x) => ({ ...x, [k]: !x[k] }))} />
                  </div>
                ))}
              </>
            )}
          </>
        )}
        <div className="lin-chave"><span>Tempo de tela</span><button type="button" role="switch" aria-checked={tela} aria-label="Tempo de tela" className={`chave ${tela ? 'on' : ''}`} onClick={() => setTela(!tela)} /></div>
        {tela && (
          <div style={{ marginBottom: 12 }}>
            <RepetirCampo nome="tela" rotulo="Lançar tempo de tela · Repetir" inicial={opcaoDaTarefa(telaTarefa)} dataInicial={telaTarefa?.tipo === 'pontual' ? telaTarefa.data_inicio : null} hoje={hoje} />
          </div>
        )}
        <div className="lin-chave"><span>Acesso ativo{eu && <small>Você não pode desativar a si mesmo</small>}</span><button type="button" role="switch" aria-checked={ativo} aria-label="Acesso ativo" disabled={eu} className={`chave ${ativo ? 'on' : ''}`} onClick={() => setAtivo(!ativo)} /></div>
        {m && <p className="peq-cinza">{m.user_id ? 'Já entrou no app' : m.email ? 'Convite pendente' : 'Sem e-mail: não consegue entrar'}</p>}
        {convidar && <input type="hidden" name="enviar" value="1" />}
        {ja && <input type="hidden" name="existente" value={ja.id} />}
        {ja && <div className="caixa-papel" role="status" style={{ marginTop: 12 }}><b>{ja.nome}</b> já está neste grupo com este e-mail. {ja.user_id ? 'Toque abaixo para mandar um novo e-mail de acesso.' : 'Toque abaixo para mandar o convite.'}</div>}
        <button className="btn bloco" style={{ marginTop: 12 }} disabled={bloqueado}>{m ? 'Salvar' : ja ? rotuloJa : convidar ? 'Salvar e enviar convite' : 'Adicionar pessoa'}</button>
        {!m && !ja && <p className="peq-cinza">A foto pode ser colocada depois de salvar. Para mandar o convite, digite o e-mail e toque em Salvar e enviar convite.</p>}
        {folha && (
          <CorFolha cor={cor} setCor={setCor} fechar={() => setFolha(false)} usadas={usadas}
            topo={<div className="cartao-l"><Avatar nome={nome || '?'} cor={cor} tam={42} /><span><b>{nome || 'Nova pessoa'}</b><small className="peq-cinza">{f ? rotuloFuncao(f.id, null) : ''}</small></span></div>} />
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
          <ConfirmarBotao acao={excluirPessoa} campos={{ id: m.id }} rotulo="Excluir pessoa" classe="btn perigo sec"
            titulo="Excluir pessoa?" nome={m.nome} detalhe={nomeFuncao(m)}
            avatar={<Avatar nome={m.nome} cor={m.cor || '#1a6fe0'} url={url} avatar={m.avatar} tam={40} />}
            pergunta={<>Excluir <b>{m.nome}</b> apaga também as tarefas e o histórico dela. Se só quiser tirar o acesso, desligue “Acesso ativo”.</>}
            sim="Sim, excluir" nao="Cancelar" />
        </div>
      )}
    </>
  );
}
