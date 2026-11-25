'use client';
// @arquivo  client.js: cliente do Supabase para o navegador (uma só instância).
// @tipo     infra
import { createBrowserClient } from '@supabase/ssr';

let cliente;
export function supabaseBrowser() {
  if (!cliente) cliente = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return cliente;
}
