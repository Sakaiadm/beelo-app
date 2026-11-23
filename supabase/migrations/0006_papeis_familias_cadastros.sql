-- beelo 0006: funções das pessoas (pai, mãe, filho, sobrinho, supervisor, aluno, outro),
-- responsável da família, edição de famílias, exclusão de pessoas e categoria "Trabalho".
-- Pode rodar mais de uma vez sem problema.

-- ============ Pessoas: função e permissões ============
alter table public.ra_membros add column if not exists funcao text;
alter table public.ra_membros drop constraint if exists ra_membros_funcao_check;
alter table public.ra_membros add constraint ra_membros_funcao_check
  check (funcao is null or funcao in ('pai','mae','filho','sobrinho','aluno','supervisor','outro'));
alter table public.ra_membros add column if not exists permissoes jsonb not null default '{}'::jsonb;
update public.ra_membros
   set funcao = case when papel = 'gestor' then (case when lower(nome) in ('mãe','mae') then 'mae' else 'pai' end) else 'filho' end
 where funcao is null;

-- ============ Responsável da família ============
alter table public.ra_familias add column if not exists responsavel_id uuid references public.ra_membros(id) on delete set null;

-- ============ Categoria "Trabalho" (sem "Estágio") ============
update public.ra_categorias c set nome = 'Trabalho'
 where c.nome = 'Trabalho/Estágio'
   and not exists (select 1 from public.ra_categorias x where x.familia_id = c.familia_id and lower(x.nome) = 'trabalho');
create or replace function public.ra_seed_categorias(p_fam uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_categorias(familia_id, nome, cor, ordem)
  select p_fam, c.nome, c.cor, c.ordem
    from (values ('Casa','laranja',1),('Estudo','indigo',2),('Esporte','verde',3),('Lazer','azul',4),('Social','rosa',5),
                 ('Saúde','vermelho',6),('Cuidado pessoal','ciano',7),('Espiritual','amarelo',8),('Financeiro','oliva',9),
                 ('Trabalho','marrom',10),('Outros','cinza',99)) as c(nome, cor, ordem)
   where not exists (select 1 from public.ra_categorias x where x.familia_id = p_fam and lower(x.nome) = lower(c.nome))
$$;

-- ============ Editar família (nome e imagem) ============
create or replace function public.ra_editar_familia(p_id uuid, p_nome text, p_avatar text, p_mudar_avatar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if not (public.ra_sou_super() or (me.id is not null and me.papel = 'gestor' and me.familia_id = p_id)) then
    raise exception 'Sem permissão';
  end if;
  if char_length(trim(coalesce(p_nome, ''))) < 1 then raise exception 'Informe o nome da família'; end if;
  if p_mudar_avatar and p_avatar is not null and p_avatar not like 'preset:%' and p_avatar not like p_id::text || '/familia/%' then
    raise exception 'Imagem inválida';
  end if;
  update public.ra_familias set nome = left(trim(p_nome), 60), avatar = case when p_mudar_avatar then p_avatar else avatar end where id = p_id;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe) values (p_id, me.id, 'editar_familia', jsonb_build_object('nome', left(trim(p_nome), 60)));
end $$;

-- ============ Pessoas de uma família (para o administrador geral) ============
create or replace function public.ra_admin_membros(p_familia uuid)
returns table(id uuid, nome text, email text, funcao text, papel text, ativo boolean, entrou boolean, responsavel boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.ra_sou_super() then raise exception 'Apenas o administrador geral'; end if;
  return query
  select m.id, m.nome, m.email, m.funcao, m.papel, m.ativo, m.user_id is not null,
         m.id = coalesce(f.responsavel_id, (select g.id from public.ra_membros g where g.familia_id = f.id and g.papel = 'gestor' order by g.criado_em limit 1))
    from public.ra_membros m join public.ra_familias f on f.id = m.familia_id
   where m.familia_id = p_familia order by m.papel, m.nome;
end $$;

-- ============ Trocar o responsável da família ============
create or replace function public.ra_definir_responsavel(p_familia uuid, p_membro uuid, p_nome text, p_email text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); v_id uuid := p_membro; v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not (public.ra_sou_super() or (me.id is not null and me.papel = 'gestor' and me.familia_id = p_familia)) then
    raise exception 'Sem permissão';
  end if;
  if v_id is not null then
    if not exists(select 1 from public.ra_membros where id = v_id and familia_id = p_familia and papel = 'gestor') then
      raise exception 'Escolha um pai ou uma mãe da família';
    end if;
  else
    if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'E-mail inválido'; end if;
    if exists(select 1 from public.ra_membros where lower(email) = v_email) then raise exception 'Este e-mail já está cadastrado'; end if;
    insert into public.ra_membros(familia_id, email, nome, papel, funcao, cor)
    values (p_familia, v_email, left(trim(coalesce(nullif(p_nome, ''), 'Responsável')), 60), 'gestor', 'pai', '#0f4fae') returning id into v_id;
  end if;
  update public.ra_familias set responsavel_id = v_id where id = p_familia;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe) values (p_familia, me.id, 'trocar_responsavel', jsonb_build_object('novo', v_id));
end $$;

-- ============ Excluir pessoa (apaga também as tarefas e o histórico dela) ============
create or replace function public.ra_excluir_membro(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); alvo public.ra_membros;
begin
  if me.id is null or me.papel <> 'gestor' then raise exception 'Apenas pais'; end if;
  select * into alvo from public.ra_membros where id = p_id and familia_id = me.familia_id;
  if alvo.id is null then raise exception 'Pessoa não encontrada'; end if;
  if alvo.id = me.id then raise exception 'Você não pode excluir a si mesmo'; end if;
  if alvo.papel = 'gestor' and (select count(*) from public.ra_membros where familia_id = me.familia_id and papel = 'gestor' and ativo and id <> alvo.id) = 0 then
    raise exception 'A família precisa ter pelo menos um pai ou mãe';
  end if;
  delete from public.ra_membros where id = alvo.id;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe) values (me.familia_id, me.id, 'excluir_pessoa', jsonb_build_object('nome', alvo.nome));
end $$;

-- ============ Imagem da família enviada pelo administrador geral ============
drop policy if exists ra_avatar_ins_super on storage.objects;
create policy ra_avatar_ins_super on storage.objects for insert to authenticated
  with check (bucket_id = 'rotina-avatares' and public.ra_sou_super());

-- ============ Permissões das novas funções ============
revoke execute on function public.ra_editar_familia(uuid, text, text, boolean) from public, anon;
revoke execute on function public.ra_admin_membros(uuid) from public, anon;
revoke execute on function public.ra_definir_responsavel(uuid, uuid, text, text) from public, anon;
revoke execute on function public.ra_excluir_membro(uuid) from public, anon;
grant execute on function public.ra_editar_familia(uuid, text, text, boolean) to authenticated;
grant execute on function public.ra_admin_membros(uuid) to authenticated;
grant execute on function public.ra_definir_responsavel(uuid, uuid, text, text) to authenticated;
grant execute on function public.ra_excluir_membro(uuid) to authenticated;
