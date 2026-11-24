import { CONTATO, ATUALIZADO_EM, VERSAO_TERMOS } from '@/lib/contato';
import Preencher from '@/components/Preencher';

// Peças comuns das páginas Termos de uso, Privacidade e Termo de consentimento.
export const L = {
  controlador: <Preencher valor={CONTATO.controlador} rotulo="nome do responsável pelo beelo" />,
  documento: <Preencher valor={CONTATO.documento} rotulo="CPF ou CNPJ" />,
  encarregado: <Preencher valor={CONTATO.encarregado} rotulo="nome do encarregado" />,
  email: <Preencher valor={CONTATO.email} rotulo="e-mail de contato" />,
  zap: <Preencher valor={CONTATO.whatsapp} rotulo="WhatsApp" />,
};

export function PaginaLegal({ titulo, children, links }) {
  return (
    <main className="estreito">
      <a href="/" className="logo-beelo" role="img" aria-label="beelo" style={{ marginBottom: 18 }} />
      <h1 className="titulo">{titulo}</h1>
      <p style={{ color: 'var(--cinza)', fontSize: 14, margin: '6px 0 16px' }}>Versão beta · versão {VERSAO_TERMOS} · atualizado em {ATUALIZADO_EM}</p>
      <div className="card texto-legal">
        {children}
        <p style={{ marginBottom: 0, marginTop: 22 }}>{links}</p>
      </div>
    </main>
  );
}
