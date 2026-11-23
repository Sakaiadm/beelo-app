-- beelo 0015: aviso no celular na hora de lançar o tempo de tela. Pode rodar mais de uma vez.
-- Mantém o lembrete das tarefas prioritárias como estava e soma o aviso da tarefa "Lançar tempo de tela"
-- (chega quando dá o horário de "Lançar sempre às", em quem ligou os avisos no aparelho).
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

  -- Lançar tempo de tela: aviso na hora marcada (até 30 min depois, se o envio atrasar).
  for r in
    select o.id, o.familia_id, o.membro_id
      from public.ra_ocorrencias o join public.ra_tarefas t on t.id = o.tarefa_id
     where o.data = v_agora::date and o.status = 'pendente' and o.lembrete_em is null and o.hora_inicio is not null
       and t.especial = 'tela' and t.ativa
       and v_agora >= (o.data + o.hora_inicio)
       and v_agora < (o.data + o.hora_inicio) + interval '30 minutes'
     for update of o skip locked
  loop
    insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
    values (r.familia_id, r.membro_id, 'Hora de lançar o tempo de tela', '/tela');
    update public.ra_ocorrencias set lembrete_em = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.ra_gerar_lembretes() from public, anon, authenticated;

notify pgrst, 'reload schema';
