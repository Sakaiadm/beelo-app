import ConfirmarBotao from './ConfirmarBotao';
import { excluirTarefa } from '@/app/acoes';

// Excluir pede confirmação (balão) antes de apagar.
export default function ExcluirTarefa({ id, voltar, titulo, detalhe }) {
  return (
    <div className="card">
      <p style={{ margin: '0 0 10px', fontSize: 'var(--f-apoio)', color: 'var(--cinza)' }}>Excluir para de gerar a tarefa daqui para frente. O histórico já feito continua nos relatórios.</p>
      <ConfirmarBotao acao={excluirTarefa} campos={voltar ? { id, voltar } : { id }} rotulo="Excluir tarefa" classe="btn perigo"
        titulo="Excluir tarefa?" nome={titulo} detalhe={detalhe}
        pergunta="Tem certeza que quer excluir esta tarefa? Ela para de ser gerada daqui para frente. O histórico já feito continua nos relatórios."
        sim="Sim, excluir" nao="Não, voltar" simples={false} />
    </div>
  );
}
