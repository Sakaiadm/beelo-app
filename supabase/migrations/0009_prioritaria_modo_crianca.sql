-- Rotina Ativa 0009: tarefa prioritária com lembrete extra e modo criança. Pode rodar mais de uma vez.
alter table public.ra_tarefas add column if not exists prioritaria boolean not null default false;
alter table public.ra_tarefas add column if not exists lembrete_min int;
alter table public.ra_tarefas drop constraint if exists ra_tarefas_lembrete_min_chk;
alter table public.ra_tarefas add constraint ra_tarefas_lembrete_min_chk check (lembrete_min is null or lembrete_min in (15, 30, 60));
alter table public.ra_ocorrencias add column if not exists lembrete_em timestamptz;
alter table public.ra_membros add column if not exists modo_crianca boolean not null default false;

-- Cria os lembretes das tarefas prioritárias que estão chegando (chamada pelo envio de avisos, a cada 15 s).
create or replace function public.ra_gerar_lembretes() returns int
language plpgsql security definer set search_path = public as $$
declare v_agora timestamp := now() at time zone 'America/Sao_Paulo'; n int := 0; r record;
begin
  for r in
    select o.id, o.familia_id, o.membro_id, o.hora_inicio, t.titulo, t.lembrete_min
      from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id
     where o.data = v_agora::date and o.status = 'pendente' and o.lembrete_em is null and o.hora_inicio is not null
       and t.prioritaria and t.ativa and t.lembrete_min is not null
       and v_agora >= (o.data + o.hora_inicio) - make_interval(mins => t.lembrete_min)
       and v_agora < (o.data + o.hora_inicio)
     for update of o skip locked
  loop
    insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
    values (r.familia_id, r.membro_id,
            'Daqui a ' || case when r.lembrete_min = 60 then '1 h' else r.lembrete_min || ' min' end || ': ' || r.titulo
              || ' (às ' || to_char(r.hora_inicio, 'HH24:MI') || ')', '/hoje');
    update public.ra_ocorrencias set lembrete_em = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.ra_gerar_lembretes() from public, anon, authenticated;

create or replace function public.ra_push_pendentes(p_segredo text, p_limite int default 40)
returns table(notif_id uuid, titulo text, link text, endpoint text, p256dh text, auth text, nao_lidas int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_push_segredo_ok(p_segredo) then raise exception 'Acesso negado'; end if;
  perform public.ra_gerar_lembretes();
  -- sem aparelho cadastrado ou muito antigo: nada a enviar
  update public.ra_notificacoes n set push_em = now()
   where n.push_em is null
     and (n.criado_em < now() - interval '1 day'
          or not exists (select 1 from public.ra_push_inscricoes i where i.membro_id = n.para_membro));
  return query
  select n.id, n.titulo, n.link, i.endpoint, i.p256dh, i.auth,
         (select count(*)::int from public.ra_notificacoes x where x.para_membro = n.para_membro and not x.lida)
    from public.ra_notificacoes n
    join public.ra_push_inscricoes i on i.membro_id = n.para_membro
   where n.push_em is null
   order by n.criado_em
   limit greatest(1, least(p_limite, 200));
end $$;
grant execute on function public.ra_push_pendentes(text, int) to anon, authenticated;

notify pgrst, 'reload schema';
