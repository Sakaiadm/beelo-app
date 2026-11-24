-- beelo 0018: mudanças do Raio-X do tempo de tela. Pode rodar mais de uma vez.
-- 1) O adulto acompanhado (papel "Outro usuário") define o próprio previsto.
-- 2) Os dias de "Lançar tempo de tela" seguem os dias do previsto (lança no dia seguinte).
-- 3) Botão "Lembrar" no Painel: manda um aviso para a pessoa lançar o tempo de ontem.

-- 1) Adulto acompanhado cuida do próprio previsto
drop policy if exists ra_tp_adulto on public.ra_tela_previsto;
create policy ra_tp_adulto on public.ra_tela_previsto for all using (
  familia_id = public.ra_minha_familia() and membro_id = public.ra_meu_id()
  and exists (select 1 from public.ra_membros m where m.id = public.ra_meu_id() and m.funcao = 'outro'))
  with check (
  familia_id = public.ra_minha_familia() and membro_id = public.ra_meu_id() and criado_por = public.ra_meu_id()
  and exists (select 1 from public.ra_membros m where m.id = public.ra_meu_id() and m.funcao = 'outro'));

-- 2) Dias de lançar = dia seguinte a cada dia com previsto (sem previsto ou com os 7 dias: todo dia)
create or replace function public.ra_tela_ajustar_tarefa(p_membro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_fam uuid := public.ra_minha_familia();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  t public.ra_tarefas;
  v_dias int[];
  v_lanc int[] := '{}';
begin
  if v_fam is null then return; end if;
  if not (public.ra_sou_gestor()
          or (p_membro = public.ra_meu_id() and exists (select 1 from public.ra_membros m where m.id = p_membro and m.funcao = 'outro'))) then
    raise exception 'Sem permissão';
  end if;
  select * into t from public.ra_tarefas
   where responsavel_id = p_membro and familia_id = v_fam and especial = 'tela' and ativa limit 1;
  if not found then return; end if;
  -- Previstos que repetem (o de "só um dia" não muda os dias de lançar)
  select coalesce(array_agg(distinct x order by x), '{}') into v_dias
    from public.ra_tela_previsto p, unnest(p.dias_semana) x
   where p.membro_id = p_membro and p.familia_id = v_fam
     and (p.vigencia_fim is null or (p.vigencia_fim >= v_hoje and p.vigencia_fim <> p.vigencia_inicio));
  if cardinality(v_dias) between 1 and 6 then
    select array_agg(distinct (x + 1) % 7 order by (x + 1) % 7) into v_lanc from unnest(v_dias) x;
  end if;
  if t.tipo = 'recorrente' and ((cardinality(v_lanc) = 0 and t.recorrencia = 'diaria')
                                or (t.recorrencia = 'dias_semana' and t.dias_semana = v_lanc)) then
    return; -- já está certo
  end if;
  update public.ra_tarefas
     set tipo = 'recorrente', recorrencia = case when cardinality(v_lanc) = 0 then 'diaria' else 'dias_semana' end,
         dias_semana = v_lanc
   where id = t.id;
  -- Próximas: saem dos dias que não têm mais lançamento e voltam nos que passaram a ter
  update public.ra_ocorrencias set status = 'cancelada'
   where tarefa_id = t.id and status = 'pendente' and data >= v_hoje
     and cardinality(v_lanc) > 0 and not (extract(dow from data)::int = any(v_lanc));
  update public.ra_ocorrencias set status = 'pendente'
   where tarefa_id = t.id and status = 'cancelada' and data >= v_hoje
     and (cardinality(v_lanc) = 0 or extract(dow from data)::int = any(v_lanc));
  perform public.ra_gerar_ocorrencias(v_hoje, v_hoje + 54);
end $$;
revoke execute on function public.ra_tela_ajustar_tarefa(uuid) from public, anon;
grant execute on function public.ra_tela_ajustar_tarefa(uuid) to authenticated;

-- 3) Lembrar: um aviso por pessoa a cada 3 horas, no máximo
create or replace function public.ra_lembrar_tela(p_membro uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_fam uuid := public.ra_minha_familia();
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  if not exists (select 1 from public.ra_membros where id = p_membro and familia_id = v_fam and ativo) then
    raise exception 'Pessoa não encontrada';
  end if;
  if exists (select 1 from public.ra_notificacoes where para_membro = p_membro
              and titulo = 'Lembrete: lance o tempo de tela de ontem' and criado_em > now() - interval '3 hours') then
    return;
  end if;
  insert into public.ra_notificacoes (familia_id, para_membro, titulo, link)
  values (v_fam, p_membro, 'Lembrete: lance o tempo de tela de ontem', '/hoje');
end $$;
revoke execute on function public.ra_lembrar_tela(uuid) from public, anon;
grant execute on function public.ra_lembrar_tela(uuid) to authenticated;
