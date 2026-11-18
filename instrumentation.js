// Roda uma vez quando o servidor do app sobe: liga o envio de avisos no celular (se as chaves existirem).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarDespachante } = await import('./lib/despachante.js');
    iniciarDespachante();
  }
}
