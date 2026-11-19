'use client';
import { useState } from 'react';
import Form from './Form';
import { adminCriarFamilia } from '@/app/acoes';
import { validarEmail } from '@/lib/email';

export default function NovaFamiliaForm() {
  const [fam, setFam] = useState(''); const [nome, setNome] = useState(''); const [email, setEmail] = useState('');
  const v = validarEmail(email);
  return (
    <Form acao={adminCriarFamilia} okTxt="Grupo criado." className="card">
      <label htmlFor="nf-f">Nome do grupo</label><input id="nf-f" name="familia" value={fam} onChange={(e) => setFam(e.target.value)} required maxLength={60} placeholder="Ex.: Família Silva" />
      <label htmlFor="nf-n">Nome do responsável</label><input id="nf-n" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={60} />
      <label htmlFor="nf-e">E-mail do responsável</label>
      <div className={`campo-ok ${email ? (v.ok ? 'ok' : 'erro') : ''}`}>
        <input id="nf-e" name="email" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))} onBlur={() => setEmail(v.email || '')} placeholder="nome@gmail.com" />
        {email && v.ok && <span className="certo" aria-label="E-mail válido">✓</span>}
      </div>
      {email && !v.ok && <p className="erro-campo" role="alert">{v.msg}</p>}
      {v.ok && v.sugestao && <p className="sug-campo">Você quis dizer <button type="button" onClick={() => setEmail(v.sugestao)}>{v.sugestao}</button>? Toque para corrigir.</p>}
      <button className="btn bloco" style={{ marginTop: 12 }} disabled={!fam.trim() || !nome.trim() || !v.ok}>Criar grupo</button>
    </Form>
  );
}
