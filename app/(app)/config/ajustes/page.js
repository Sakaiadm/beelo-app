// @arquivo  page.js: rota antiga; leva para Segurança e privacidade (/seguranca).
// @tipo     tela
// @usado-por Next.js (rota /config/ajustes)
import { redirect } from 'next/navigation';

// A antiga tela Configurações virou Segurança e privacidade (menu do nome, no topo).
export default function Ajustes() {
  redirect('/seguranca');
}
