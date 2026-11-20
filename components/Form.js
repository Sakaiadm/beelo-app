'use client';
import { useEffect, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { MSG, falhaDeRede, semRede, mensagemDeErro, comLimite, avisarFalhaDeRede } from '@/lib/rede';
import { guardar, podeGuardar } from '@/lib/fila';

const LIMITE_MS = 25000; // depois disso o botão para de "girar" e a pessoa recebe uma explicação

// Envia o formulário sem deixar o React limpar os campos depois (o React 19 faz isso por padrão
// com <form action>, e isso desfazia a escolha de seletores já preenchidos, como o Papel).
// Também cuida da falta de internet: ações simples (prop `fila`) ficam guardadas no aparelho e são
// enviadas depois; as outras avisam em português, sem perder o que foi digitado.
// `discreto`: não mostra o aviso de "salvo no aparelho" (a própria tela já mostra).
// `simples`: a ação recebe só os dados (formato das ações usadas direto em <form action>).
export default function Form({ acao, children, okTxt, limpar, className, style, fila, rotulo, simples, discreto, msgSemInternet }) {
  // Estado próprio (e não useActionState): assim o aviso de "internet lenta" aparece mesmo enquanto o
  // envio ainda está preso na rede. Com useActionState, o React só mostrava o resultado quando a rede respondia.
  const [estado, setEstado] = useState(null);
  const [pendente, setPendente] = useState(false);
  const ref = useRef(null);
  const vivo = useRef(true);
  useEffect(() => () => { vivo.current = false; }, []);
  useEffect(() => { if (estado?.ok && limpar) ref.current?.reset(); }, [estado, limpar]);

  async function processar(fd) {
    const guardarNoAparelho = () => {
      const dados = {};
      for (const [k, v] of fd.entries()) if (typeof v === 'string') dados[k] = v;
      const r = guardar(fila, dados, rotulo);
      return { ok: true, guardado: true, msg: r === 'anulado' ? 'Pronto. Como ainda não tinha sido enviado, foi só desfeito no aparelho.' : MSG.guardado };
    };
    const semInternet = () => ({ erro: msgSemInternet || (temTexto(fd) ? MSG.semInternetTexto : MSG.semInternet) });
    const comFila = fila && podeGuardar(fila);
    if (semRede()) {
      avisarFalhaDeRede();
      return comFila ? guardarNoAparelho() : semInternet();
    }
    try {
      const r = await comLimite(simples ? acao(fd) : acao(estado, fd), LIMITE_MS);
      if (r?.tempoEsgotado) return { erro: MSG.lento };
      return r ?? null;
    } catch (e) {
      try { unstable_rethrow(e); } catch { return { navegando: true }; } // o servidor pediu outra tela: ela já está abrindo
      if (falhaDeRede(e)) {
        avisarFalhaDeRede();
        return comFila ? guardarNoAparelho() : semInternet();
      }
      return { erro: mensagemDeErro(e) };
    }
  }

  const aoEnviar = async (e) => {
    e.preventDefault();
    if (pendente) return;
    const dados = new FormData(e.currentTarget, e.nativeEvent.submitter);
    setPendente(true); setEstado(null);
    const r = await processar(dados);
    if (!vivo.current) return;
    if (r?.navegando) { setTimeout(() => vivo.current && setPendente(false), LIMITE_MS); return; } // continua "enviando" até a nova tela abrir
    setEstado(r); setPendente(false);
  };
  return (
    <form ref={ref} onSubmit={aoEnviar} className={className} style={style} aria-busy={pendente}>
      {estado?.erro && <div className="aviso erro" role="alert">{estado.erro}</div>}
      {estado?.ok && (estado.guardado ? !discreto && <div className="aviso info" role="status">{estado.msg}</div>
        : (estado.msg || okTxt) && <div className="aviso ok" role="status">{estado.msg || okTxt}</div>)}
      <fieldset disabled={pendente} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
    </form>
  );
}

// O formulário tem algo que a pessoa digitou (para avisar que não se perdeu)?
function temTexto(fd) {
  for (const [k, v] of fd.entries()) if (typeof v === 'string' && v.trim() && !/^(oc|id|valor|aprovar|aceitar|ativa|ativo|voltar)$/.test(k)) return true;
  return false;
}
