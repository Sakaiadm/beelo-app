-- beelo 0036: o dia de HOJE só conta como "dia bom" nos desafios a partir das 19h (Brasília).
-- Motivo: marcar tudo cedo (ex.: 0h10, tarefas sem horário) fechava o desafio com o dia inteiro pela frente,
-- e desafio cumprido não volta atrás. Antes das 19h, hoje fica "em andamento" (como já era com tarefa faltando).
-- Dias passados não mudam. Pode rodar mais de uma vez (se já aplicada, não muda nada).
-- Só troca uma linha da função ra_desafio_calc (criada na 0016), sem recopiar a função inteira.
do $$
declare
  v_def text;
  v_novo text;
begin
  v_def := pg_get_functiondef('public.ra_desafio_calc(public.ra_desafios,date,date,date)'::regprocedure);
  if v_def like '%America/Sao_Paulo%< 19%' then return; end if;
  v_novo := replace(v_def,
    'elsif r.f >= r.n then v_st := ''ok'';',
    'elsif r.f >= r.n and not (r.dia = p_hoje and extract(hour from (now() at time zone ''America/Sao_Paulo'')) < 19) then v_st := ''ok'';');
  if v_novo = v_def then raise exception 'beelo 0036: trecho não encontrado em ra_desafio_calc'; end if;
  execute v_novo;
end $$;
