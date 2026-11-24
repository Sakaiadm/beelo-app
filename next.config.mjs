/** @type {import('next').NextConfig} */
// Content-Security-Policy (varredura, item M6): o navegador só carrega código, imagens e conexões
// do próprio app, do Supabase e das fontes do Google. Uma segunda barreira contra scripts estranhos.
const supa = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gvaxypupzgimgftshqng.supabase.co').replace(/\/$/, '');
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${supa}`,
  `connect-src 'self' ${supa} ${supa.replace(/^https/, 'wss')}`,
  "media-src 'self' data: blob:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
const seguranca = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
];
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['web-push', 'nodemailer'],
  experimental: { serverActions: { bodySizeLimit: '1mb' } },
  // Manuais ilustrados públicos, um por perfil: /manual (Pai, Mãe e Supervisor; também para parceiros e clientes),
  // /manual/pessoa (filhos, sobrinhos, alunos) e /manual/crianca (modo criança).
  async rewrites() {
    return [
      { source: '/manual', destination: '/manual.html' },
      { source: '/manual/pessoa', destination: '/manual-pessoa.html' },
      { source: '/manual/crianca', destination: '/manual-crianca.html' },
    ];
  },
  async headers() {
    return [
      { source: '/(.*)', headers: seguranca },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },
};
export default nextConfig;
