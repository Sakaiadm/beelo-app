// Roda uma vez quando o servidor do app sobe: liga o envio de avisos no celular (se as chaves existirem)
// e mantém o banco acordado para a abertura do app não demorar.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarDespachante } = await import('./lib/despachante.js');
    iniciarDespachante();
    const { iniciarAquecimento } = await import('./lib/aquecer.js');
    iniciarAquecimento();
  }
}
