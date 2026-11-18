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
  serverExternalPackages: ['web-push'],
  experimental: { serverActions: { bodySizeLimit: '1mb' } },
  async headers() {
    return [
      { source: '/(.*)', headers: seguranca },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },
};
export default nextConfig;
