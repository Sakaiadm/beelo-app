// Mostra o valor do contato ou, se ainda vazio, um campo destacado para preencher.
export default function Preencher({ valor, rotulo }) {
  return valor ? <b>{valor}</b> : <span className="preencher">{rotulo}</span>;
}
