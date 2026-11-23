-- beelo 0013: Pai ou Mãe que cria uma tarefa para si (inclusive a "Lançar tempo de tela" ao ligar
-- o tempo de tela em Meu perfil) não gera mais o aviso "X criou a tarefa" para si mesmo e para o
-- outro responsável. O aviso "criou uma tarefa para si" continua valendo para as outras pessoas.
-- Pode rodar mais de uma vez.
create or replace function public.ra_tg_tarefa_nova() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.criada_por <> new.responsavel_id then
    perform public.ra_notificar(new.familia_id, new.responsavel_id, 'Nova tarefa: ' || new.titulo, '/hoje');
  elsif not exists (select 1 from public.ra_membros where id = new.responsavel_id and papel = 'gestor') then
    perform public.ra_notificar_gestores_tipo(new.familia_id, 'tarefa_filho',
      (select nome from public.ra_membros where id = new.responsavel_id) || ' criou a tarefa: ' || new.titulo, '/tarefas');
  end if;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe)
  values (new.familia_id, new.criada_por, 'criar_tarefa', jsonb_build_object('tarefa', new.id, 'titulo', new.titulo));
  return new;
end $$;
