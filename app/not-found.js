// @arquivo  not-found.js: tela de página não encontrada.
// @tipo     tela
// @usa      components/TelaErro
// @usado-por Next.js (arquivo especial do app)
import TelaErro from '@/components/TelaErro';

export const metadata = { title: 'Página não encontrada · beelo' };

export default function NaoEncontrada() {
  return <TelaErro tipo="naoEncontrada" />;
}
