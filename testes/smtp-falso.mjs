// @arquivo  smtp-falso.mjs: servidor de e-mail falso que guarda os e-mails em /tmp/emails-teste.json.
// @tipo     teste
// Servidor de e-mail falso (só para teste): guarda cada e-mail recebido em /tmp/emails-teste.json
import net from 'node:net';
import fs from 'node:fs';
const ARQ = '/tmp/emails-teste.json';
fs.writeFileSync(ARQ, '[]');
net.createServer((s) => {
  s.write('220 smtp-falso ESMTP\r\n');
  let dados = false, buf = '', msg = { de: '', para: [], corpo: '' }, auth = 0;
  s.on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const l = buf.slice(0, i); buf = buf.slice(i + 2);
      if (dados) {
        if (l === '.') { dados = false; const todos = JSON.parse(fs.readFileSync(ARQ)); todos.push(msg); fs.writeFileSync(ARQ, JSON.stringify(todos)); msg = { de: '', para: [], corpo: '' }; s.write('250 ok\r\n'); }
        else msg.corpo += l + '\n';
        continue;
      }
      if (auth) { s.write(auth === 1 ? '334 UGFzc3dvcmQ6\r\n' : '235 ok\r\n'); auth = auth === 1 ? 2 : 0; continue; }
      if (/^EHLO/i.test(l)) s.write('250-smtp-falso\r\n250 AUTH LOGIN PLAIN\r\n');
      else if (/^AUTH PLAIN/i.test(l)) s.write('235 ok\r\n');
      else if (/^AUTH LOGIN/i.test(l)) { auth = 1; s.write('334 VXNlcm5hbWU6\r\n'); }
      else if (/^MAIL FROM/i.test(l)) { msg.de = l; s.write('250 ok\r\n'); }
      else if (/^RCPT TO/i.test(l)) { msg.para.push(l); s.write('250 ok\r\n'); }
      else if (/^DATA/i.test(l)) { dados = true; s.write('354 go\r\n'); }
      else if (/^QUIT/i.test(l)) { s.write('221 bye\r\n'); s.end(); }
      else s.write('250 ok\r\n');
    }
  });
}).listen(2525, () => console.log('smtp falso pronto'));
