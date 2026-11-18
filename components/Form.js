'use client';
import { useActionState, useEffect, useRef } from 'react';

// Formulário com mensagem de erro/sucesso vinda da ação do servidor.
export default function Form({ acao, children, okTxt, limpar, className, style }) {
  const [estado, enviar, pendente] = useActionState(acao, null);
  const ref = useRef(null);
  useEffect(() => { if (estado?.ok && limpar) ref.current?.reset(); }, [estado, limpar]);
  return (
    <form ref={ref} action={enviar} className={className} style={style} aria-busy={pendente}>
      {estado?.erro && <div className="aviso erro" role="alert">{estado.erro}</div>}
      {estado?.ok && okTxt && <div className="aviso ok" role="status">{okTxt}</div>}
      <fieldset disabled={pendente} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
    </form>
  );
}
