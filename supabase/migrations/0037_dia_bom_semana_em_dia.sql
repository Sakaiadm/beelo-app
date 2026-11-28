-- beelo 0037: "dia bom" + meta em dias, só no desafio "Semana em dia" (c1), como exemplo (Thomas, 28/11).
-- Dia bom = 80% das tarefas do dia feitas; o resultado do dia só sai no dia seguinte (hoje fica "em andamento").
-- A meta passa a ser em dias (5 na semana), então tarefa nova não derruba mais o número.
-- Quando a meta fica impossível, o desafio avisa e os Responsáveis recebem uma notificação para decidir.
-- Pode rodar mais de uma vez. Os 4 blocos podem ser colados um por vez, nesta ordem.

-- ===== Bloco 1: colunas novas e conversão dos desafios c1 que já existem =====
alter table public.ra_desafios add column if not exists dia_bom_pct int not null default 100 check (dia_bom_pct between 50 and 100);
alter table public.ra_desafios add column if not exists semana_decidida date;   -- início da semana em que o Responsável já decidiu
alter table public.ra_desafios add column if not exists decisao text check (decisao in ('leve','manter','trocar'));
alter table public.ra_desafios add column if not exists impossivel_avisado date; -- início da semana em que já avisamos
update public.ra_desafios set tipo = 'dias', meta = 5, dia_bom_pct = 80, alvo = 'todas',
       descricao = '5 dias bons na semana. Dia bom: 80% das tarefas do dia feitas.'
 where catalogo = 'c1' and ativo and tipo = 'pct';

-- ===== Bloco 2: ra_desafio_calc entende dia_bom_pct e diz quando a meta ficou impossível =====
do $$
declare v_def text; v_novo text;
begin
  v_def := pg_get_functiondef('public.ra_desafio_calc(public.ra_desafios,date,date,date)'::regprocedure);
  if v_def like '%dia_bom_pct%' then return; end if;
  v_novo := replace(v_def,
    'elsif r.f >= r.n and not (r.dia = p_hoje and extract(hour from (now() at time zone ''America/Sao_Paulo'')) < 19) then v_st := ''ok'';',
    'elsif r.f * 100 >= d.dia_bom_pct * r.n and not (r.dia = p_hoje and (d.dia_bom_pct < 100 or extract(hour from (now() at time zone ''America/Sao_Paulo'')) < 19)) then v_st := ''ok'';');
  if v_novo = v_def then raise exception 'beelo 0037: trecho do dia bom não encontrado em ra_desafio_calc (rode a 0036 antes)'; end if;
  v_def := v_novo;
  v_novo := replace(v_def,
    '''coringa'', v_cor_dia, ''dias'', v_dias);',
    '''coringa'', v_cor_dia, ''dias'', v_dias, ''impossivel'', (d.tipo = ''dias'' and d.dia_bom_pct < 100 and p_hoje <= p_fim and v_ok + (p_fim - p_hoje + 1) < v_req));');
  if v_novo = v_def then raise exception 'beelo 0037: retorno não encontrado em ra_desafio_calc'; end if;
  execute v_novo;
end $$;

-- ===== Bloco 3: ra_desafios_atualizar avisa os Responsáveis (uma vez por semana) quando a meta ficou impossível =====
do $$
declare v_def text; v_novo text;
begin
  v_def := pg_get_functiondef('public.ra_desafios_atualizar()'::regprocedure);
  if v_def like '%impossivel_avisado%' then return; end if;
  v_novo := replace(v_def,
    'v_ini := v_fim + 1;',
    'if d.dia_bom_pct < 100 and coalesce((c->>''impossivel'')::boolean, false) and d.impossivel_avisado is distinct from v_ini then
        update public.ra_desafios set impossivel_avisado = v_ini where id = d.id;
        select nome into v_nome from public.ra_membros where id = d.membro_id;
        perform public.ra_notificar_gestores(d.familia_id, coalesce(v_nome, ''A família'') || '': a meta da semana de '' || d.titulo || '' não dá mais para bater. Pegar mais leve, manter ou trocar?'', ''/desafios'');
      end if;
      v_ini := v_fim + 1;');
  if v_novo = v_def then raise exception 'beelo 0037: trecho não encontrado em ra_desafios_atualizar'; end if;
  execute v_novo;
end $$;
