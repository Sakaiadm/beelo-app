const { chromium } = require(process.env.PW_ROOT + '/playwright');
const sess = (tok) => 'base64-' + Buffer.from(JSON.stringify({ access_token: tok, token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'x', email: 'x', aud: 'authenticated' } })).toString('base64url');
(async()=>{const b=await chromium.launch();
for (const [w,n] of [[380,'m'],[1100,'d']]){const c=await b.newContext({viewport:{width:w,height:620}});
await c.addCookies([{name:'sb-127-auth-token',value:sess('tok-pai'),url:'http://127.0.0.1:3100'}]);
const p=await c.newPage();await p.goto('http://127.0.0.1:3100/painel');console.log(p.url(), (await p.content()).length);
await p.click('.usuario-btn',{timeout:5000}).catch(e=>console.log('sem botao'));await p.screenshot({path:`/tmp/claude-0/topo-${n}.png`});
console.log(n, await p.evaluate(()=>document.documentElement.scrollWidth));}
await b.close()})();
