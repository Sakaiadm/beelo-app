import nodemailer from 'nodemailer';

export const emailConfigurado = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Envia o e-mail do convite com o botão que abre o app. ja = a pessoa já tem cadastro (só lembra de entrar).
export async function enviarEmailConvite({ para, nomePessoa, nomeFamilia, quemConvida, ja, papel }) {
  const base = (process.env.APP_URL || 'https://rotina.sakaiadm.tech').replace(/\/$/, '');
  const link = `${base}/login?email=${encodeURIComponent(para)}&${ja ? 'ja=1' : 'convite=1'}`;
  const porta = Number(process.env.SMTP_PORT || 465);
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: porta, secure: porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
  });
  const assunto = ja ? 'Entre no Beelo' : `${quemConvida} convidou você para o Beelo`;
  const frase = ja
    ? `Você já tem cadastro no grupo ${nomeFamilia}. Toque no botão e entre com sua conta.`
    : `${quemConvida} convidou você para o grupo ${nomeFamilia} no Beelo, o app de rotina e tarefas. Toque no botão, confirme seu e-mail e entre.`;
  const intro = ja
    ? `Você já tem cadastro no grupo <b>${esc(nomeFamilia)}</b>. Toque no botão abaixo e entre com a sua conta.`
    : `<b>${esc(quemConvida)}</b> convidou você para fazer parte do grupo <b>${esc(nomeFamilia)}</b> no Beelo, o aplicativo que organiza as tarefas, a agenda e o acompanhamento da rotina de cada pessoa.`;
  const passos = ja ? '' : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eaf2fe;border-radius:14px;margin:6px 0 4px"><tr><td style="padding:14px 16px;font-size:14px;line-height:1.6;color:#16233b;text-align:justify"><b>Como entrar, em 3 passos</b><br>1. Toque no botão abaixo.<br>2. Confirme o seu e-mail na tela que abrir.<br>3. Toque em &ldquo;Receber link de entrada por e-mail&rdquo; e depois no link que chegar. Não precisa de senha.</td></tr></table>`;
  const papelTxt = papel ? `<p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#5a6880;text-align:justify">Seu papel no grupo: <b style="color:#16233b">${esc(papel)}</b></p>` : '';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;background:#f4f7fd;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;color:#16233b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fd"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dfe7f5">
<tr><td style="background:#1a6fe0;padding:28px 28px 26px">
 <img src="${esc(base)}/marca/beelo-horizontal-negativa-branca.png" width="130" height="44" alt="Beelo" style="display:block;border:0;height:44px;width:130px;font-size:24px;font-weight:800;color:#ffffff">
 <div style="margin-top:14px;font-size:14px;color:#e6f0fe;line-height:1.5">Tarefas, agenda e acompanhamento do seu grupo.</div>
</td></tr>
<tr><td style="padding:28px 28px 8px">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:800;color:#16233b">Olá, ${esc(nomePessoa)}!</h1>
<p style="margin:0 0 14px;font-size:15px;line-height:1.65;text-align:justify;color:#16233b">${intro}</p>
${passos}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0"><tr><td style="background:#1a6fe0;border-radius:14px"><a href="${esc(link)}" style="display:inline-block;padding:15px 26px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none">Abrir o Beelo</a></td></tr></table>
${papelTxt}
</td></tr>
<tr><td style="padding:8px 28px 28px">
 <div style="border-top:1px solid #e6edf8;padding-top:16px;font-size:12px;color:#5a6880;line-height:1.6;text-align:justify">Se o botão não abrir, copie este endereço no navegador:<br><span style="color:#1a6fe0;word-break:break-all">${esc(link)}</span><br><br>Se você não esperava este convite, pode ignorar este e-mail com tranquilidade. Nada será feito sem a sua entrada.</div>
</td></tr></table>
<div style="max-width:520px;font-size:11px;color:#8a97ad;text-align:center;padding:14px 8px">Beelo &middot; ${esc(base.replace(/^https?:\/\//, ''))}</div>
</td></tr></table></body></html>`;
  await t.sendMail({ from: { name: 'Beelo', address: (process.env.SMTP_DE || '').match(/<([^>]+)>/)?.[1] || process.env.SMTP_USER }, to: para, subject: assunto, text: `${frase}\n\nAbra: ${link}`, html });
  return link;
}
