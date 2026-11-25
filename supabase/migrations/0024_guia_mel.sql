-- @migracao 0024: Guia da Mel (beta). Uma chave por grupo, que só o administrador geral liga e desliga.
-- @altera ra_familias (coluna guia_mel)
-- @cria   funções ra_guia_mel_ligar(p_familia, p_ligar) e ra_guia_mel_estado(p_familia)
-- Seguro rodar de novo. Desligado, o app fica exatamente como era (sem Mel, sem Favo, sem balões).
-- O que cada pessoa já viu das dicas fica guardado no próprio aparelho, então não precisa de mais nada no banco.

alter table public.ra_familias add column if not exists guia_mel boolean not null default false;

create or replace function public.ra_guia_mel_ligar(p_familia uuid, p_ligar boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  update public.ra_familias set guia_mel = coalesce(p_ligar, false) where id = p_familia;
end $$;
grant execute on function public.ra_guia_mel_ligar(uuid, boolean) to authenticated;

-- Lê a chave de qualquer grupo (só o administrador geral; os demais usam a leitura normal do próprio grupo).
create or replace function public.ra_guia_mel_estado(p_familia uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case when public.ra_sou_super() then coalesce((select guia_mel from public.ra_familias where id = p_familia), false) else false end
$$;
grant execute on function public.ra_guia_mel_estado(uuid) to authenticated;

-- Já ativada para o grupo do administrador geral (quem for administrador agora).
update public.ra_familias set guia_mel = true
 where id in (select m.familia_id from public.ra_membros m
               join public.ra_superadmins s on lower(s.email) = lower(coalesce(m.email, ''))
              where m.user_id is not null);
