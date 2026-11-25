# Avisos, e-mail e funcionamento offline 🟪

## Avisos no celular (push)
```
Banco (ra_notificacoes + ra_push_inscricoes)
   ▲ grava aviso (gatilhos e ra_gerar_lembretes)
   │
lib/despachante.js  ── a cada 60 s ──►  rpc ra_push_pendentes  (pede os avisos novos)
   │  envia com web-push (chaves VAPID)    ──►  celular (public/sw.js mostra o aviso)
   └──────────────►  rpc ra_push_concluir  (informa o que já foi; remove aparelhos mortos)
```
- Roda **dentro do app na VPS**: `instrumentation.js` chama `iniciarDespachante()` ao subir o servidor. Sem as chaves, fica desligado e avisa no log (`[push] envio desligado, falta: …`).
- Variáveis (`.env` da VPS, criadas por `deploy/instalar.sh` na primeira vez): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_ASSUNTO`, `PUSH_SEGREDO`. O segredo também precisa estar no banco (`select public.ra_push_definir_segredo('…')`, mostrado no fim da instalação).
- Intervalo: 60 s (`PUSH_INTERVALO_S` no `.env`, mínimo 10). O aviso chega até 1 minuto depois do fato.
- Falha passageira (sem rede, 429, 5xx): tenta de novo na próxima volta. Aparelho que não existe mais (404/410): é removido.
- No aparelho: `components/AvisosCelular.js` liga/desliga e guarda a inscrição (`ra_push_inscrever`); `public/sw.js` recebe (`push`) e abre o assunto ao tocar (`notificationclick` → `/notificacoes/abrir`). iPhone só recebe push com o app instalado na tela inicial (PWA).
- Número no ícone: `components/Selo.js`.
- Teste: `node testes/push.mjs`.

## E-mail de convite
`lib/convite.js` (nodemailer) envia o convite com o botão que abre o app. Precisa de `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_DE` no `.env` (configure com `bash deploy/config-email.sh`; a senha nunca vai para o GitHub). Sem SMTP, o convite mostra "O e-mail de envio ainda não foi configurado no servidor." (`app/acoes.js`, `reenviarConvite`). `lib/email.js` confere o endereço digitado e sugere correção de erro comum.

## Manter o banco acordado
`lib/aquecer.js`: a cada 10 minutos faz 5 consultas leves, sem login (nenhum dado de ninguém), porque depois de ~50 minutos parado o banco demorava 5 a 10 s na primeira abertura.

## Offline
| Peça | O que faz |
|---|---|
| `public/sw.js` | guarda a última cópia das telas iniciais (Painel/Hoje) e abre na hora pelo ícone; mostra a cópia (com faixa "Sem internet") ou `public/offline.html`; guarda arquivos do app e os manuais públicos. Cópia vale até 7 dias. |
| `components/LembrarInicio.js` | guarda no aparelho qual é a tela inicial e quem usa, para abrir direto nela |
| `components/Conexao.js` | faixa "Sem internet" e dispara o envio da fila quando volta |
| `lib/fila.js` | fila no aparelho: concluir sem foto, desfazer, justificar, adiar, horário, conferir e respostas dos pais. Tenta 3 vezes; para no primeiro sinal de falta de rede. **Fotos, convites e cadastros não entram.** |
| `components/Form.js` | decide se a ação vai direto ou para a fila |
| `lib/rede.js` | mensagens em português para cada falha |

⚠️ Mudou algo que o service worker guarda? Troque a versão do cache em `public/sw.js` (`TELAS`, `OFFLINE`, `MANUAL`), senão os aparelhos continuam com a cópia velha.
Teste: `testes/offline.mjs`.
