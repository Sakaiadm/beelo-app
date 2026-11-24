// As mesmas palavras em todos os pedidos (U32): "Aprovar" e "Agora não"; nas tarefas, "Conferido" e "Refazer".
export const PEDIDO = (campo) => [
  { txt: 'Aprovar', feito: 'Aprovado', valores: { [campo]: '1' }, classe: 'btn peq' },
  { txt: 'Agora não', feito: 'Respondido: agora não', valores: { [campo]: '0' }, classe: 'btn sec peq' },
];
export const CONFERIR = [
  { txt: 'Conferido', feito: 'Conferido', valores: { valor: 'conferido' }, classe: 'btn sec peq' },
  { txt: 'Refazer', feito: 'Pedido para refazer', valores: { valor: 'refazer' }, classe: 'btn perigo peq' },
];
