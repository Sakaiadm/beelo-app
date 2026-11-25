// @arquivo  components/GuiaChave.js: caixinha "Guia da Mel (beta)" (só administrador geral), no mesmo estilo do beta de Desafios.
// @tipo     componente
// @usa      app/acoes-guia.js
// @usado-por app/(app)/config/page.js, app/(app)/config/familias/[id]/page.js
// @decisao 25/11 Thomas: já ativada para ele; desativou, o app volta como era (sem Mel, Favo ou balões).
import Form from './Form';
import { ligarGuiaMel } from '@/app/acoes-guia';

export default function GuiaChave({ familiaId, ligado }) {
  return (
    <Form simples acao={ligarGuiaMel} className="card guia-chave">
      <div className="lin-chave" style={{ border: 0, padding: 0 }}>
        <input type="hidden" name="familia" value={familiaId} /><input type="hidden" name="ligar" value={ligado ? '0' : '1'} />
        <span>Guia da Mel (beta)<small>Dicas curtas da abelha, só para teste. Desativou, o app volta como era.</small></span>
        <button className={`chave ${ligado ? 'on' : ''}`} role="switch" aria-checked={ligado} aria-label="Guia da Mel (beta)" />
      </div>
    </Form>
  );
}
