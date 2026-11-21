/** @type {import('next').NextConfig} */
const seguranca = [
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
