'use client';
import { startTransition, useActionState, useEffect, useRef } from 'react';

// Envia o formulário sem deixar o React limpar os campos depois (o React 19 faz isso por padrão
// com <form action>, e isso desfazia a escolha de seletores já preenchidos, como o Papel).
export default function Form({ acao, children, okTxt, limpar, className, style, aoConcluir }) {
  const [estado, enviar, pendente] = useActionState(acao, null);
  const ref = useRef(null);
  useEffect(() => { if (estado?.ok && limpar) ref.current?.reset(); }, [estado, limpar]);
  useEffect(() => { if (estado?.ok) aoConcluir?.(); }, [estado]); // eslint-disable-line react-hooks/exhaustive-deps
  const aoEnviar = (e) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget, e.nativeEvent.submitter);
    startTransition(() => enviar(dados));
  };
  return (
    <form ref={ref} onSubmit={aoEnviar} className={className} style={style} aria-busy={pendente}>
      {estado?.erro && <div className="aviso erro" role="alert">{estado.erro}</div>}
      {estado?.ok && (estado.msg || okTxt) && <div className="aviso ok" role="status">{estado.msg || okTxt}</div>}
      <fieldset disabled={pendente} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
    </form>
  );
}
