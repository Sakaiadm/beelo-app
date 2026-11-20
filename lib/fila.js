'use client';
// Fila no aparelho: quando não há internet, algumas ações simples (concluir sem foto, desfazer,
// justificar, adiar, horário, conferir e respostas dos pais) ficam guardadas aqui e são enviadas
// sozinhas quando a conexão volta. Fotos, convites e cadastros não entram: esses pedem internet.
import { useEffect, useState } from 'react';
import { concluir, desfazer, justificar, pedirAdiamento, definirHorario, conferir, responderAdiamento, avaliarJustificativa, responderTela } from '@/app/acoes';
import { falhaDeRede, comLimite, MSG } from '@/lib/rede';

const ACOES = { concluir, desfazer, justificar, pedirAdiamento, definirHorario, conferir, responderAdiamento, avaliarJustificativa, responderTela };
export const podeGuardar = (tipo) => !!ACOES[tipo];

const CHAVE = 'ra_fila_v1';
const EVENTO = 'ra-fila';

function ler() {
  try { const v = JSON.parse(localStorage.getItem(CHAVE) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function gravar(lista) {
  try { localStorage.setItem(CHAVE, JSON.stringify(lista)); } catch {}
  try { window.dispatchEvent(new Event(EVENTO)); } catch {}
}
export function quemEsta() {
  try { return (document.cookie.split('; ').find((c) => c.startsWith('ra_u=')) || '').slice(5) || null; } catch { return null; }
}
const alvo = (d) => d.oc || d.id || '';

// Guarda uma ação. Devolve 'guardado' ou 'anulado' (quando desfaz algo que ainda nem tinha sido enviado).
export function guardar(tipo, dados, rotulo) {
  const quem = quemEsta();
  let lista = ler();
  const oposto = { concluir: 'desfazer', desfazer: 'concluir' }[tipo];
  if (oposto) {
    const i = lista.findIndex((x) => x.quem === quem && x.tipo === oposto && alvo(x.dados) === alvo(dados));
    if (i >= 0) { lista.splice(i, 1); gravar(lista); return 'anulado'; }
  }
  // Se a mesma ação para o mesmo item já estava guardada, fica só a mais nova.
  lista = lista.filter((x) => !(x.quem === quem && x.tipo === tipo && alvo(x.dados) === alvo(dados)));
  lista.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, tipo, dados, rotulo: rotulo || '', quem, em: Date.now(), tentativas: 0 });
  gravar(lista);
  return 'guardado';
}

// Lista do que está esperando internet, desta pessoa, atualizada sozinha.
export function useFila() {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    const atualizar = () => { const q = quemEsta(); setLista(ler().filter((x) => x.quem === q)); };
    atualizar();
    window.addEventListener(EVENTO, atualizar);
    window.addEventListener('storage', atualizar);
    return () => { window.removeEventListener(EVENTO, atualizar); window.removeEventListener('storage', atualizar); };
  }, []);
  return lista;
}

let enviando = null;
// Envia o que estiver guardado, na ordem em que foi feito. Para no primeiro sinal de falta de rede.
export function enviarFila() {
  if (enviando) return enviando;
  enviando = (async () => {
    const quem = quemEsta();
    const res = { enviados: [], recusados: [], parou: null };
    for (const item of ler().filter((x) => x.quem === quem)) {
      const fd = new FormData();
      Object.entries(item.dados || {}).forEach(([k, v]) => fd.append(k, v));
      let r;
      try {
        r = await comLimite(ACOES[item.tipo] ? ACOES[item.tipo](null, fd) : Promise.resolve({ erro: 'Ação desconhecida' }), 30000);
      } catch (e) {
        if (falhaDeRede(e)) { res.parou = 'rede'; break; }
        const lista = ler(); const x = lista.find((y) => y.id === item.id);
        if (x) {
          x.tentativas = (x.tentativas || 0) + 1;
          if (x.tentativas >= 3) { lista.splice(lista.indexOf(x), 1); res.recusados.push({ rotulo: item.rotulo, erro: MSG.servidor }); }
          gravar(lista);
        }
        res.parou = 'servidor'; break;
      }
      if (r?.tempoEsgotado) { res.parou = 'lento'; break; }
      if (r?.sessao) { res.parou = 'sessao'; break; }
      gravar(ler().filter((y) => y.id !== item.id));
      if (r?.erro) res.recusados.push({ rotulo: item.rotulo, erro: r.erro });
      else res.enviados.push(item.rotulo);
    }
    return res;
  })().finally(() => { enviando = null; });
  return enviando;
}
