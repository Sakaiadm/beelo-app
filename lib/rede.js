// @arquivo  rede.js: mensagens em português para falha de internet, lentidão ou servidor fora.
// @tipo     regra
// @usado-por app/acoes-desafios.js, app/acoes.js, app/login/page.js, components/AvatarUpload.js, components/AvisosCelular.js, components/FamiliaEditor.js e mais 4
// Mensagens e ajudas para quando a internet falha, fica lenta ou o servidor não responde.
// Tudo em português simples, dizendo o que a pessoa deve fazer.

export const MSG = {
  semInternet: 'Sem internet. Confira o Wi-Fi ou os dados móveis e tente de novo.',
  semInternetFoto: 'Sem internet. A foto só pode ser enviada com internet. Tente de novo quando a conexão voltar.',
  semInternetTexto: 'Sem internet. O que você escreveu continua aqui. Toque de novo quando a conexão voltar.',
  lento: 'A internet está lenta e a resposta não chegou. Espere um pouco e confira se ficou salvo. Se não ficou, tente de novo.',
  servidor: 'O app não conseguiu falar com o servidor agora. Espere um minuto e tente de novo.',
  sessao: 'Sua sessão expirou. Saia e entre de novo para continuar.',
  guardado: 'Salvo no aparelho. Enviaremos quando a internet voltar.',
};

// A falha foi de rede (sem internet, conexão caiu)? Cada navegador escreve de um jeito.
export function falhaDeRede(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const m = String((e && (e.message || e)) || '');
  return (e instanceof TypeError && /fetch|load|network/i.test(m)) || /Failed to fetch|Load failed|NetworkError|network ?error|ERR_INTERNET|ERR_NETWORK|fetch failed/i.test(m);
}

export const semRede = () => typeof navigator !== 'undefined' && navigator.onLine === false;

// Avisa a faixa do topo que a rede falhou (ela confere sozinha quando voltar).
export function avisarFalhaDeRede() {
  try { window.dispatchEvent(new Event('ra-sem-rede')); } catch {}
}

// Texto técnico (em inglês, de banco ou de rede) que não deve aparecer para a pessoa?
export function pareceTecnico(m) {
  return !m || /\b(the|is|not|failed|error|invalid|column|relation|function|violates|could|does|exception|unexpected|undefined|null|fetch|request|response|server|JSON|syntax)\b/i.test(m) || m.length > 220;
}

// Traduz o erro do banco/servidor para uma frase clara. `sessao: true` quando é preciso entrar de novo.
export function traduzirErro(error) {
  const m = String((error && (error.message || error)) || '').replace(/^[A-Z0-9]{5}:\s*/, '').trim();
  if (/jwt|token|not authenticated|invalid claim|refresh_token|session|Entre com sua conta/i.test(m) || error?.code === 'PGRST301' || error?.status === 401) return { erro: MSG.sessao, sessao: true };
  if (/fetch failed|ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|network|socket|Failed to fetch/i.test(m)) return { erro: MSG.servidor };
  if (/timeout|timed out|canceling statement/i.test(m)) return { erro: 'O servidor demorou para responder. Tente de novo em instantes.' };
  if (/row-level security|permission denied/i.test(m)) return { erro: 'Você não tem permissão para fazer isso.' };
  if (/duplicate/i.test(m)) return { erro: 'Isso já está cadastrado.' };
  if (/foreign key/i.test(m)) return { erro: 'Algum item usado aqui não existe mais. Atualize a tela e tente de novo.' };
  if (pareceTecnico(m)) return { erro: 'Não foi possível salvar agora. Tente de novo em instantes.' };
  return { erro: m };
}

// Transforma qualquer erro (do lado do aparelho) em uma frase clara. Nunca mostra texto em inglês ou código.
export function mensagemDeErro(e, { semInternet = MSG.semInternet } = {}) {
  if (falhaDeRede(e)) { avisarFalhaDeRede(); return semInternet; }
  const m = String((e && (e.message || e)) || '');
  if (/jwt|token|not authenticated|sess(ã|a)o expirou/i.test(m)) return MSG.sessao;
  if (/timeout|timed out|demor/i.test(m)) return MSG.lento;
  if (!pareceTecnico(m)) return m;
  return MSG.servidor;
}

// Espera a promessa até um limite de tempo; passado o limite, devolve { tempoEsgotado: true }.
export function comLimite(promessa, ms) {
  let t;
  const limite = new Promise((ok) => { t = setTimeout(() => ok({ tempoEsgotado: true }), ms); });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(t));
}
