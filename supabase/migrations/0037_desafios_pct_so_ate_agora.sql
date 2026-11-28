-- beelo 0037: o percentual dos desafios "% das tarefas" não cai mais quando entra tarefa nova (Thomas, 28/11).
-- Antes: o % dividia pelas tarefas da semana INTEIRA, então adicionar tarefa (hoje ou dias à frente) derrubava o número.
-- Agora, para EXIBIR o progresso, só contam as tarefas já vencidas: dias passados, mais as tarefas de hoje já feitas
-- (as pendentes de hoje só entram a partir das 19h, Brasília). Tarefa de dia futuro não entra.
-- Quem decide se o desafio foi CUMPRIDO continua sendo a conta da semana inteira (não muda; ninguém fecha antes da hora).
-- Só troca uma linha da função ra_desafio_calc (0016/0036). Pode rodar mais de uma vez (se já aplicada, não muda nada).
do $$
declare
  v_def text;
  v_novo text;
begin
  v_def := pg_get_functiondef('public.ra_desafio_calc(public.ra_desafios,date,date,date)'::regprocedure);
  if v_def like '%beelo 0037%' then return; end if;
  v_novo := replace(v_def,
    'v_prog := case when v_tot > 0 then (v_fei * 100) / v_tot else 0 end;',
    '/* beelo 0037 */ select coalesce(sum(case when q.dd < p_hoje then q.n when q.dd = p_hoje then (case when extract(hour from (now() at time zone ''America/Sao_Paulo'')) >= 19 then q.n else q.f end) else 0 end), 0)::int, coalesce(sum(case when q.dd <= p_hoje then q.f else 0 end), 0)::int into v_x, v_prev from (select (e2->>''d'')::date as dd, (e2->>''n'')::int as n, (e2->>''f'')::int as f from jsonb_array_elements(v_dias) e2) q where v_cor_dia is null or q.dd <> v_cor_dia; v_prog := case when v_x > 0 then (v_prev * 100) / v_x else 0 end;');
  if v_novo = v_def then raise exception 'beelo 0037: trecho não encontrado em ra_desafio_calc'; end if;
  execute v_novo;
end $$;
