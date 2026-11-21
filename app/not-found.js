import TelaErro from '@/components/TelaErro';

export const metadata = { title: 'Página não encontrada · Rotina Ativa' };

export default function NaoEncontrada() {
  return <TelaErro tipo="naoEncontrada" />;
}
