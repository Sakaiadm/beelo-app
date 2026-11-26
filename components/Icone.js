// @arquivo  Icone.js: todos os ícones do app (SVG), pelo nome.
// @tipo     componente
// @usado-por app/(app)/agenda/page.js, app/(app)/ajuda/page.js, app/(app)/config/categorias/page.js, app/(app)/config/familias/page.js, app/(app)/config/page.js, app/(app)/config/pessoas/page.js e mais 38
const P = {
  check: <path d="M20 6 9 17l-5-5" />,
  sino: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  sol: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  lua: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  hoje: <><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" /></>,
  agenda: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  lista: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  painel: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  grafico: <><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></>,
  tela: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>,
  pc: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  config: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  familia: <><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" /><path d="M3.5 18c0-3 2-4.5 4.5-4.5s4.5 1.5 4.5 4.5M11.5 18c0-3 2-4.5 4.5-4.5s4.5 1.5 4.5 4.5" /></>,
  pessoa: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-4 3-6 7-6s7 2 7 6" /></>,
  etiqueta: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></>,
  ajustes: <><path d="M4 7h8M18 7h2M4 12h2M12 12h8M4 17h9M19 17h1" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="16" cy="17" r="2" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
  lapis: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  alerta: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  circulo: <circle cx="12" cy="12" r="10" />,
  relogio: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" /><circle cx="12" cy="13" r="3" /></>,
  galeria: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>,
  esq: <path d="m15 18-6-6 6-6" />,
  dir: <path d="m9 18 6-6-6-6" />,
  baixo: <path d="m6 9 6 6 6-6" />,
  bandeira: <path d="M5 21V4h12l-2.5 4 2.5 4H5" fill="var(--prio)" />,
  trofeu: <><path d="M8 3h8v6a4 4 0 0 1-8 0z" /><path d="M8 5H5v1.5A3 3 0 0 0 8 9.5M16 5h3v1.5A3 3 0 0 1 16 9.5M12 13v4M9.5 21h5M10 17h4v4" /></>,
  escudo: <><path d="M12 3 5 5.8v5.5c0 4.3 2.9 7.7 7 9.2 4.1-1.5 7-4.9 7-9.2V5.8z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  lampada: <><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z" /></>,
  // Lâmpada acesa (topo e Ideias, seção 66): a mesma lâmpada, menor, com raios em volta.
  ideia: <><path d="M9.9 18.2h4.2M10.6 21h2.8" /><path d="M12 7a4.9 4.9 0 0 0-2.8 8.89c.42.35.7.84.7 1.4v.21h4.2v-.21c0-.56.28-1.05.7-1.4A4.9 4.9 0 0 0 12 7Z" /><path d="M12 1.2v2.3M4.4 4.6l1.6 1.6M19.6 4.6 18 6.2M1.6 11.6h2.3M22.4 11.6h-2.3" /></>,
  fala: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
  presente: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8c-2.5 0-4.5-1-4.5-2.7S9.6 3 12 8c2.4-5 4.5-4.4 4.5-2.7S14.5 8 12 8Z" /></>,
  tBroto: <><path d="M12 21v-8" /><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6Z" /><path d="M12 15c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" /></>,
  tBussola: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  livro: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M9 7h7M9 11h5" /></>,
  sair: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  cadeado: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  lixeira: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  bloquear: <><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>,
  // Ícones das categorias de Sugestões
  cCasa: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  cEstudo: <><path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13" /><path d="M8 7h7" /></>,
  cSaude: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z" />,
  cCuidado: <path d="M12 3c3.2 4.2 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.8-6.8 6-11z" />,
  cEsporte: <path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12" />,
  cPet: <><circle cx="6.3" cy="10.2" r="1.9" /><circle cx="9.9" cy="5.9" r="1.9" /><circle cx="14.1" cy="5.9" r="1.9" /><circle cx="17.7" cy="10.2" r="1.9" /><path d="M12 11.6c-2.7 0-5.1 2.6-5.1 5 0 1.6 1.3 2.5 2.6 2.5.9 0 1.5-.4 2.5-.4s1.6.4 2.5.4c1.3 0 2.6-.9 2.6-2.5 0-2.4-2.4-5-5.1-5z" /></>,
  cLazer: <><path d="M12 1.8 19 8.5 12 15.2 5 8.5z" /><path d="M12 1.8v13.4M5 8.5h14" /><path d="M12 15.2q-2.6 1.7 0 3.4t0 3.4" /><path d="M10.6 17.4l-1.8-.4M10.6 17.4l-.9 1.5" /></>,
  cSocial: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.5A6 6 0 0 1 21 20" /></>,
  cEspiritual: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
  cFinanceiro: <><circle cx="12" cy="12" r="9" /><path d="M14.8 9.3c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2s1.2 1.6 2.8 1.9 2.8.8 2.8 2-1.2 2-2.8 2c-1.3 0-2.4-.5-2.9-1.4M12 6.3v11.4" /></>,
  cTrabalho: <><rect x="3" y="7.5" width="18" height="12" rx="2" /><path d="M8.5 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2M3 12.5h18" /></>,
};
export default function Icone({ nome, tam = 22, cor = 'currentColor', larg = 2, rotulo }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={larg} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={rotulo ? undefined : 'true'} role={rotulo ? 'img' : undefined} aria-label={rotulo}>
      {P[nome]}
    </svg>
  );
}
