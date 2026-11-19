import nodemailer from 'nodemailer';

export const emailConfigurado = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Envia o e-mail do convite com o botão que abre o app. ja = a pessoa já tem cadastro (só lembra de entrar).
export async function enviarEmailConvite({ para, nomePessoa, nomeFamilia, quemConvida, ja }) {
  const base = (process.env.APP_URL || 'https://rotina.sakaiadm.tech').replace(/\/$/, '');
  const link = `${base}/login?email=${encodeURIComponent(para)}&${ja ? 'ja=1' : 'convite=1'}`;
  const porta = Number(process.env.SMTP_PORT || 465);
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: porta, secure: porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 20000,
  });
  const assunto = ja ? 'Entre no Rotina Ativa' : `${quemConvida} convidou você para o Rotina Ativa`;
  const frase = ja
    ? `Você já tem cadastro na família ${nomeFamilia}. Toque no botão e entre com sua conta.`
    : `${quemConvida} convidou você para a família ${nomeFamilia} no Rotina Ativa, o app da rotina da família. Toque no botão, confirme seu e-mail e entre.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#16233b">
<h2 style="color:#1a6fe0;margin:0 0 12px">Rotina Ativa</h2>
<p>Olá, ${esc(nomePessoa)}!</p><p>${esc(frase)}</p>
<p style="margin:24px 0"><a href="${esc(link)}" style="background:#1a6fe0;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:bold;display:inline-block">Abrir o Rotina Ativa</a></p>
<p style="font-size:13px;color:#5a6880">Se o botão não abrir, copie este endereço no navegador:<br>${esc(link)}</p>
<p style="font-size:12px;color:#5a6880">Se você não esperava este convite, pode ignorar este e-mail.</p></div>`;
  await t.sendMail({ from: process.env.SMTP_DE || process.env.SMTP_USER, to: para, subject: assunto, text: `${frase}\n\nAbra: ${link}`, html });
  return link;
}
