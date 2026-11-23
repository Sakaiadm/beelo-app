-- beelo 0012: supervisor(a) (e quem tiver a chave "Ver o painel") acompanha o grupo.
-- Libera só LEITURA das tarefas, do dia a dia, dos pedidos, do tempo de tela e das fotos do grupo,
-- conforme as chaves do cadastro, e o botão Conferido/Refazer para quem tem a chave "Conferir tarefas".
-- Pai e Mãe continuam com tudo. Pode rodar mais de uma vez.

-- Chave ligada para quem está entrando? Pai e Mãe: sempre sim.
-- Sem a chave guardada, vale o padrão do cadastro (supervisor: ver painel, conferir e ver relatórios ligados).
create or replace function public.ra_pode(p_chave text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
     where m.user_id = auth.uid() and m.ativo and f.ativa
       and (m.papel = 'gestor'
            or coalesce((m.permissoes ->> p_chave)::boolean,
                        m.funcao = 'supervisor' and p_chave in ('ver_painel', 'conferir', 'ver_relatorios'))))
$$;

-- Vê o grupo todo (só leitura): Pai, Mãe ou quem tem "Ver o painel" ou "Ver relatórios".
create or replace function public.ra_acompanha() returns boolean
language sql stable security definer set search_path = public as $$
  select public.ra_pode('ver_painel') or public.ra_pode('ver_relatorios')
$$;
grant execute on function public.ra_pode(text), public.ra_acompanha() to authenticated;

drop policy if exists ra_tar_sel on public.ra_tarefas;
create policy ra_tar_sel on public.ra_tarefas for select using (
  familia_id = public.ra_minha_familia() and (public.ra_acompanha() or responsavel_id = public.ra_meu_id()));

drop policy if exists ra_oc_sel on public.ra_ocorrencias;
create policy ra_oc_sel on public.ra_ocorrencias for select using (
  familia_id = public.ra_minha_familia() and (public.ra_acompanha() or membro_id = public.ra_meu_id()));

drop policy if exists ra_adi_sel on public.ra_adiamentos;
create policy ra_adi_sel on public.ra_adiamentos for select using (
  familia_id = public.ra_minha_familia() and (public.ra_acompanha() or membro_id = public.ra_meu_id()));

drop policy if exists ra_tp_sel on public.ra_tela_previsto;
create policy ra_tp_sel on public.ra_tela_previsto for select using (
  familia_id = public.ra_minha_familia() and (public.ra_acompanha() or membro_id = public.ra_meu_id()));

drop policy if exists ra_tpr_sel on public.ra_tela_proposta;
create policy ra_tpr_sel on public.ra_tela_proposta for select using (
  familia_id = public.ra_minha_familia() and (public.ra_acompanha() or membro_id = public.ra_meu_id()));

drop policy if exists ra_tr_sel on public.ra_tela_real;
create policy ra_tr_sel on public.ra_tela_real for select using (
  familia_id = public.ra_minha_familia() and (public.ra_acompanha() or membro_id = public.ra_meu_id()));

drop policy if exists ra_foto_sel on storage.objects;
create policy ra_foto_sel on storage.objects for select to authenticated using (
  bucket_id = 'rotina-fotos'
  and (storage.foldername(name))[1] = public.ra_minha_familia()::text
  and (public.ra_acompanha() or (storage.foldername(name))[2] = public.ra_meu_id()::text));

-- Conferido / Refazer: Pai, Mãe ou quem tem a chave "Conferir tarefas".
create or replace function public.ra_conferir(p_oc uuid, p_valor text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias;
begin
  if not public.ra_pode('conferir') then raise exception 'Apenas pais'; end if;
  if p_valor not in ('conferido', 'refazer') then raise exception 'Valor inválido'; end if;
  update public.ra_ocorrencias set conferido = p_valor,
    status = case when p_valor = 'refazer' then 'pendente' else status end
   where id = p_oc and familia_id = public.ra_minha_familia() and membro_id <> public.ra_meu_id() returning * into o;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  if p_valor = 'refazer' then
    perform public.ra_notificar(o.familia_id, o.membro_id, 'Refazer: ' || (select titulo from public.ra_tarefas where id = o.tarefa_id), '/hoje');
  end if;
  perform public.ra_log('conferir', jsonb_build_object('ocorrencia', p_oc, 'valor', p_valor));
end $$;
