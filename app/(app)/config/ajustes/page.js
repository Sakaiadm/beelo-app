import { redirect } from 'next/navigation';

// A antiga tela Configurações virou Segurança e privacidade (menu do nome, no topo).
export default function Ajustes() {
  redirect('/seguranca');
}
