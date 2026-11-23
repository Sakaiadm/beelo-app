'use client';
import { useRef, useState } from 'react';
import Form from './Form';
import FamiliaAvatar from './FamiliaAvatar';
import Icone from './Icone';
import { preparar } from './AvatarUpload';
import { MSG, semRede, falhaDeRede, comLimite, avisarFalhaDeRede } from '@/lib/rede';
import { supabaseBrowser } from '@/lib/supabase/client';
import { editarFamilia, trocarResponsavel } from '@/app/acoes';
import { validarEmail } from '@/lib/email';

// Cartão do grupo: nome editável, foto redonda (lápis para trocar, X para remover) e responsável (com Trocar).
export default function FamiliaEditor({ familia, url, resp, gestores = [], resumo }) {
  const ref = useRef(null);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(familia.nome);
  const [foto, setFoto] = useState({ caminho: undefined, previa: url || '', msg: '' });
  const [folha, setFolha] = useState(false);
  const [rn, setRn] = useState(''); const [re, setRe] = useState('');
  const v = validarEmail(re);
  async function escolher(e) {
    const arq = e.target.files?.[0]; if (!arq) return;
    if (semRede()) { avisarFalhaDeRede(); setFoto((f) => ({ ...f, msg: MSG.semInternetFoto })); e.target.value = ''; return; }
    setFoto((f) => ({ ...f, msg: 'Enviando…' }));
    try {
      const blob = await preparar(arq);
      const caminho = `${familia.id}/familia/avatar-${Date.now()}.jpg`;
      const r = await comLimite(supabaseBrowser().storage.from('rotina-avatares').upload(caminho, blob, { contentType: 'image/jpeg' }), 60000);
      if (r.tempoEsgotado) throw new Error('timeout');
      if (r.error) throw r.error;
      setFoto({ caminho, previa: URL.createObjectURL(blob), msg: 'Foto pronta. Toque em Salvar.' });
    } catch (err) { setFoto((f) => ({ ...f, msg: falhaDeRede(err) ? MSG.semInternetFoto : 'Não foi possível enviar a foto. Tente de novo.' })); }
    e.target.value = '';
  }
  const sujo = editando || foto.caminho !== undefined;
  return (
    <>
      <Form acao={editarFamilia} okTxt="Salvo." className="cartao-l" style={{ display: 'block' }}>
        <input type="hidden" name="id" value={familia.id} />
        <input type="hidden" name="nome" value={nome} />
        {foto.caminho !== undefined && <input type="hidden" name="avatar" value={foto.caminho} />}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ position: 'relative', flex: 'none' }}>
            <button type="button" className="foto-btn" aria-label="Trocar foto do grupo" onClick={() => ref.current.click()}><FamiliaAvatar url={foto.previa} nome={nome} tam={52} /></button>
            {foto.previa && <button type="button" className="x-badge" aria-label="Remover foto" title="Remover foto" onClick={() => setFoto({ caminho: '', previa: '', msg: 'Removido. Toque em Salvar.' })}><Icone nome="x" tam={13} /></button>}
            <button type="button" className="x-badge lapis-badge" aria-label="Trocar foto do grupo" title="Trocar foto" onClick={() => ref.current.click()}><Icone nome="lapis" tam={13} /></button>
            <input ref={ref} type="file" accept="image/*" hidden onChange={escolher} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <small className="peq-cinza" style={{ margin: 0 }}>Nome do grupo</small>
            {editando ? <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} aria-label="Nome do grupo" autoFocus /> : <b style={{ fontSize: 17 }}>{nome}</b>}
          </span>
          {!editando && <button type="button" className="link-btn" onClick={() => setEditando(true)}>Editar</button>}
        </div>
        {foto.msg && <p className="peq-cinza">{foto.msg}</p>}
        {sujo && <div className="acoes" style={{ marginTop: 10 }}><button className="btn peq" disabled={!nome.trim()}>Salvar</button><button type="button" className="btn sec peq" onClick={() => { setEditando(false); setNome(familia.nome); setFoto({ caminho: undefined, previa: url || '', msg: '' }); }}>Cancelar</button></div>}
        <div style={{ borderTop: '1px solid var(--borda)', marginTop: 12, paddingTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <small className="peq-cinza" style={{ margin: 0 }}>Responsável</small>
            <b>{resp?.nome || 'Sem responsável'}</b>
            {resp?.email && <small className="peq-cinza">{resp.email}</small>}
          </span>
          <button type="button" className="link-btn" onClick={() => setFolha(true)}>Trocar</button>
        </div>
        {resumo && <p className="peq-cinza" style={{ marginTop: 10 }}>{resumo}</p>}
      </Form>
      {folha && (
        <div className="folha" role="dialog" aria-modal="true" aria-label="Trocar responsável">
          <div className="folha-in">
            <div className="folha-cab"><button type="button" className="folha-volta" aria-label="Voltar" onClick={() => setFolha(false)}><Icone nome="esq" tam={26} /></button><h2>Trocar responsável</h2></div>
            {gestores.length > 0 && (
              <>
                <p style={{ fontWeight: 700, margin: 0 }}>Responsável pelo grupo</p>
                {gestores.map((g) => (
                  <Form key={g.id} acao={trocarResponsavel} okTxt="Responsável trocado.">
                    <input type="hidden" name="familia" value={familia.id} /><input type="hidden" name="membro" value={g.id} />
                    <button className="cartao-l" style={{ width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
                      <span style={{ flex: 1 }}><b>{g.nome}</b>{g.email && <small className="peq-cinza">{g.email}</small>}</span>{g.responsavel && <span className="pilula" style={{ background: 'var(--azul-claro)', color: 'var(--azul)' }}>atual</span>}
                    </button>
                  </Form>
                ))}
              </>
            )}
            <p style={{ fontWeight: 700, margin: '8px 0 0' }}>Outra pessoa</p>
            <Form acao={trocarResponsavel} okTxt="Responsável trocado." className="card">
              <input type="hidden" name="familia" value={familia.id} />
              <label htmlFor="rn">Nome</label><input id="rn" name="nome" value={rn} onChange={(e) => setRn(e.target.value)} maxLength={60} />
              <label htmlFor="re">E-mail Google</label>
              <div className={`campo-ok ${re ? (v.ok ? 'ok' : 'erro') : ''}`}>
                <input id="re" name="email" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} value={re} onChange={(e) => setRe(e.target.value.replace(/\s+/g, ''))} onBlur={() => setRe(v.email || '')} placeholder="nome@gmail.com" />
                {re && v.ok && <span className="certo">✓</span>}
              </div>
              {re && !v.ok && <p className="erro-campo" role="alert">{v.msg}</p>}
              {v.ok && v.sugestao && <p className="sug-campo">Você quis dizer <button type="button" onClick={() => setRe(v.sugestao)}>{v.sugestao}</button>?</p>}
              <button className="btn bloco" style={{ marginTop: 12 }} disabled={!rn.trim() || !v.ok}>Trocar responsável</button>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
