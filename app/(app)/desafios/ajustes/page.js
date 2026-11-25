import { redirect } from 'next/navigation';
import { exigirGestor } from '@/lib/sessao';
import { desafiosLigados } from '@/lib/desafiosDados';
import { perfil } from '@/lib/desafios';
import Voltar from '@/components/Voltar';
import Form from '@/components/Form';
import ConfirmarBotao from '@/components/ConfirmarBotao';
import { salvarAjustesDesafios, ligarDesafios } from '@/app/acoes-desafios';

export const dynamic = 'force-dynamic';

export default async function AjustesDesafios() {
  const { membros, familia, superAdmin } = await exigirGestor();
  if (!desafiosLigados(familia)) redirect('/desafios');
  const criancas = membros.filter((m) => m.ativo && perfil(m) === 'c');
  return (
    <main className="estreito">
      <Voltar href="/desafios" titulo="Ajustes dos desafios" />
      <Form acao={salvarAjustesDesafios} className="card">
        <h2>Mural de conquistas</h2>
        <label className="check" style={{ margin: '0 0 8px' }}><input type="radio" name="mural" value="todos" defaultChecked={familia.mural_visivel !== 'pais'} style={{ width: 20, height: 20 }} /> A família toda vê</label>
        <label className="check" style={{ margin: 0 }}><input type="radio" name="mural" value="pais" defaultChecked={familia.mural_visivel === 'pais'} style={{ width: 20, height: 20 }} /> Só os pais e a própria pessoa</label>
        {criancas.length > 0 && <>
          <h2 style={{ marginTop: 20 }}>Prêmios até 8 anos</h2>
          <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '0 0 6px' }}>Ligado: a vitrine mostra os prêmios mais infantis (adesivos, massinha, história extra). Desligado: prêmios para 9 anos ou mais.</p>
          {criancas.map((m) => (
            <div key={m.id} className="lin-chave">
              <input type="hidden" name="crianca" value={m.id} />
              <label className="check" style={{ margin: 0, flex: 1, justifyContent: 'space-between' }}>{m.nome}<input type="checkbox" name={`ate8_${m.id}`} value="1" defaultChecked={!!m.premios_ate8} /></label>
            </div>
          ))}
        </>}
        <button className="btn bloco" style={{ marginTop: 16 }}>Salvar</button>
      </Form>
      {/* @regra Só o administrador geral vê a chave de desligar o beta (SQL 0025 também recusa os demais). */}
      {superAdmin && (
      <div className="card">
        <h2>Desligar os desafios</h2>
        <p className="sub" style={{ fontSize: 'var(--f-apoio)', margin: '0 0 12px' }}>Some das telas de todos. Nada se perde: ao ligar de novo, os desafios, o cofrinho e o mural voltam como estavam.</p>
        <ConfirmarBotao acao={ligarDesafios} simples={false} campos={{ ligar: '0' }} rotulo="Desligar os desafios" classe="btn perigo bloco" titulo="Desligar os desafios?" pergunta="Os desafios somem das telas de todos. Nada se perde: ao ligar de novo, tudo volta como estava." sim="Sim, desligar" icone="bloquear" />
      </div>
      )}
    </main>
  );
}
