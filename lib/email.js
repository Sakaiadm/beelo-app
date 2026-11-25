// @arquivo  email.js: confere o e-mail e sugere correção de erros de digitação (gmial.com → gmail.com).
// @tipo     regra
// @usado-por app/acoes.js, components/FamiliaEditor.js, components/NovaFamiliaForm.js, components/PessoaForm.js
// Confere o e-mail e ajuda a achar o erro de digitação. Funciona no navegador e no servidor.
const TROCAS = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.com.br': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.con': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com',
};

export function limparEmail(v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, ''); }

// Devolve { ok, email, msg, sugestao }
export function validarEmail(bruto) {
  const email = limparEmail(bruto);
  if (!email) return { ok: false, email, msg: '' };
  const arrobas = (email.match(/@/g) || []).length;
  if (arrobas === 0) return { ok: false, email, msg: 'Falta o @ no e-mail.' };
  if (arrobas > 1) return { ok: false, email, msg: 'O e-mail tem mais de um @.' };
  const [local, dominio] = email.split('@');
  if (!local) return { ok: false, email, msg: 'Falta o nome antes do @.' };
  if (!dominio) return { ok: false, email, msg: 'Falta o endereço depois do @, como gmail.com.' };
  if (!dominio.includes('.')) return { ok: false, email, msg: 'Falta o ponto no endereço, como .com.' };
  if (dominio.startsWith('.') || dominio.endsWith('.') || dominio.includes('..') || local.startsWith('.') || local.endsWith('.') || local.includes('..'))
    return { ok: false, email, msg: 'Há um ponto no lugar errado.' };
  if (!/^[a-z0-9._%+-]+$/.test(local) || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dominio)) return { ok: false, email, msg: 'Há um caractere que não pode no e-mail.' };
  if (TROCAS[dominio]) return { ok: true, email, sugestao: `${local}@${TROCAS[dominio]}` };
  return { ok: true, email };
}
