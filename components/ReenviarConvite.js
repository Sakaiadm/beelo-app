'use client';
import Form from './Form';
import { reenviarConvite } from '@/app/acoes';

// Botão "Reenviar convite" (ou "Enviar convite"), com a resposta logo embaixo.
export default function ReenviarConvite({ id, rotulo = 'Reenviar convite', classe = 'btn sec peq' }) {
  return (
    <Form acao={reenviarConvite}>
      <input type="hidden" name="id" value={id} />
      <button className={classe}>{rotulo}</button>
    </Form>
  );
}
