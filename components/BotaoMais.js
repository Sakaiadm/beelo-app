// @arquivo  BotaoMais.js: botão "+" (Tarefa, Pessoa, Grupo…) no padrão do app.
// @tipo     componente
// @usa      ./Icone
import Link from 'next/link';
import Icone from './Icone';

// Botão "+" redondo, sempre no mesmo lugar: canto de baixo, acima do menu (Raio-X U12).
export default function BotaoMais({ href, rotulo = 'Nova tarefa' }) {
  return (
    <Link prefetch={false} className="fab" href={href} aria-label={rotulo} title={rotulo}>
      <Icone nome="mais" tam={28} cor="#fff" />
    </Link>
  );
}
