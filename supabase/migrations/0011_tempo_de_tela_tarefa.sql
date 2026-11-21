-- 0011 · Tempo de tela como tarefa com hora (seção 64)
-- 1) Pessoa nova vem com o tempo de tela desligado (quem já tem continua igual)
alter table public.ra_membros alter column tela_ativo set default false;

-- 2) Marca a tarefa "Lançar tempo de tela" (uma por pessoa)
alter table public.ra_tarefas add column if not exists especial text;
alter table public.ra_tarefas drop constraint if exists ra_tarefas_especial_chk;
alter table public.ra_tarefas add constraint ra_tarefas_especial_chk check (especial is null or especial = 'tela');
create unique index if not exists ra_tarefas_tela_unica
  on public.ra_tarefas(responsavel_id) where especial = 'tela' and ativa;

-- 3) Ao salvar o tempo de ontem, a tarefa de hoje fica feita
create or replace function public.ra_tg_tela_conclui() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.data < (now() at time zone 'America/Sao_Paulo')::date then
    update public.ra_ocorrencias o
       set status = 'cumprida', concluida_em = coalesce(o.concluida_em, now())
      from public.ra_tarefas t
     where o.tarefa_id = t.id and t.especial = 'tela' and t.ativa
       and o.membro_id = new.membro_id
       and o.data = new.data + 1
       and o.status = 'pendente';
  end if;
  return new;
end $$;
drop trigger if exists ra_tela_conclui_tg on public.ra_tela_real;
create trigger ra_tela_conclui_tg after insert or update on public.ra_tela_real
  for each row execute function public.ra_tg_tela_conclui();
revoke execute on function public.ra_tg_tela_conclui() from authenticated;
