-- beelo 0019: correções da varredura de segurança e LGPD (24/11/2026) + registro dos aceites.
-- Pode rodar mais de uma vez. Não quebra a versão atual do app (é tudo acréscimo ou trava extra).

-- A2) Painel de Preços TO (outro app no mesmo banco): funções de envio não ficam mais abertas na internet.
-- O envio automático (pg_cron) continua, porque roda como administrador do banco.
do $$ begin
  revoke execute on function public.enviar_boletim_email() from public, anon, authenticated;
  revoke execute on function public.enviar_relatorio_assinantes() from public, anon, authenticated;
  revoke execute on function public.ativar_logos_email() from public, anon, authenticated;
  revoke execute on function public.enviar_confirmacao_assinatura(text, text, text) from public, anon, authenticated;
exception when undefined_function then null; end $$;

-- B1) Tabelas novas: o público (sem login) não tem permissão nenhuma. A trava RLS já barrava; agora a porta também.
revoke all on public.ra_desafios, public.ra_desafio_periodos, public.ra_premios, public.ra_premio_pedidos,
  public.ra_cofrinho, public.ra_push_inscricoes, public.ra_superadmins, public.ra_config from anon;
revoke all on public.ra_superadmins, public.ra_config from authenticated;
revoke execute on function public.ra_acompanha(), public.ra_pode(text), public.ra_push_teste(),
  public.ra_tg_tela_conclui() from public, anon;
grant execute on function public.ra_acompanha(), public.ra_pode(text), public.ra_push_teste() to authenticated;

-- B2) Caminho fixo nas funções de data do beelo.
alter function public.ra_periodo_inicio(text, date) set search_path = public;
alter function public.ra_periodo_fim(text, date) set search_path = public;

-- M1) Desafio criado pela própria pessoa (sem ser Pai ou Mãe): recompensa fixa e sem trocar pessoa, autor ou prêmio.
create or replace function public.ra_tg_desafio_proprio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.ra_sou_gestor() then return new; end if;
  if tg_op = 'INSERT' then
    new.estrelas := 10;
    new.premio := null;
    if new.recompensa = 'premio' then new.recompensa := 'nenhuma'; end if;
    return new;
  end if;
  -- Atualização: só a meta, o ativo e o encerramento podem mudar.
  new.familia_id := old.familia_id; new.membro_id := old.membro_id; new.criado_por := old.criado_por;
  new.recompensa := old.recompensa; new.estrelas := old.estrelas; new.premio := old.premio;
  new.grupo := old.grupo; new.catalogo := old.catalogo; new.tipo := old.tipo; new.alvo := old.alvo;
  new.categorias := old.categorias; new.tarefa_id := old.tarefa_id; new.criterio := old.criterio;
  new.dias_semana := old.dias_semana; new.periodo := old.periodo; new.coringa := old.coringa;
  new.criado_em := old.criado_em;
  if new.meta is null or new.meta < 1 then new.meta := old.meta; end if;
  return new;
end $$;
drop trigger if exists ra_desafio_proprio on public.ra_desafios;
create trigger ra_desafio_proprio before insert or update on public.ra_desafios
  for each row execute function public.ra_tg_desafio_proprio();
revoke execute on function public.ra_tg_desafio_proprio() from public, anon, authenticated;

-- M2) Beta fechado também no banco: grupo novo só com o cadastro aberto (ra_config 'cadastro_aberto' = '1')
-- ou pelo administrador geral (ra_admin_criar_familia, que não muda).
create or replace function public.ra_criar_familia(p_nome text, p_meu_nome text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fam uuid; v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or v_email = '' then raise exception 'Entre com sua conta primeiro'; end if;
  if coalesce((select valor from public.ra_config where chave = 'cadastro_aberto'), '0') <> '1' and not public.ra_sou_super() then
    raise exception 'Na versão beta, os grupos novos são criados pela equipe do beelo.';
  end if;
  if exists(select 1 from public.ra_membros where user_id = auth.uid() or lower(email) = v_email) then
    raise exception 'Este e-mail já participa de uma família';
  end if;
  if char_length(trim(coalesce(p_nome,''))) < 2 or char_length(trim(coalesce(p_meu_nome,''))) < 1 then
    raise exception 'Informe o nome da família e o seu nome';
  end if;
  insert into public.ra_familias(nome) values (left(trim(p_nome), 60)) returning id into fam;
  insert into public.ra_membros(familia_id, user_id, email, nome, papel, cor)
  values (fam, auth.uid(), v_email, left(trim(p_meu_nome), 60), 'gestor', '#0f4fae');
  perform public.ra_seed_categorias(fam);
  insert into public.ra_historico(familia_id, acao, detalhe) values (fam, 'criar_familia', jsonb_build_object('email', v_email));
  return fam;
end $$;

-- M3) Apagar fotos e avatares: Pai ou Mãe apaga os arquivos do próprio grupo; cada pessoa apaga os seus.
drop policy if exists ra_foto_del on storage.objects;
create policy ra_foto_del on storage.objects for delete using (
  bucket_id in ('rotina-fotos', 'rotina-avatares')
  and (storage.foldername(name))[1] = public.ra_minha_familia()::text
  and (public.ra_sou_gestor() or (storage.foldername(name))[2] = public.ra_meu_id()::text));

-- M3) Apagar o grupo inteiro (Pai ou Mãe, digitando o nome do grupo para confirmar).
-- Tudo do grupo sai junto (cascata). As fotos são apagadas pelo app antes de chamar esta função.
create or replace function public.ra_apagar_familia(p_confirmar text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); f public.ra_familias;
begin
  if me.id is null or me.papel <> 'gestor' then raise exception 'Apenas Pai ou Mãe'; end if;
  select * into f from public.ra_familias where id = me.familia_id;
  if lower(trim(coalesce(p_confirmar, ''))) <> lower(trim(f.nome)) then raise exception 'Digite o nome do grupo exatamente como aparece'; end if;
  update public.ra_familias set responsavel_id = null where id = f.id;
  delete from public.ra_familias where id = f.id;
end $$;
revoke execute on function public.ra_apagar_familia(text) from public, anon;
grant execute on function public.ra_apagar_familia(text) to authenticated;

-- A1) Registro dos aceites (Termos de uso, Privacidade, autorização do responsável e aviso para crianças).
alter table public.ra_membros add column if not exists termos_versao text;
alter table public.ra_membros add column if not exists autorizado_em timestamptz;
alter table public.ra_membros add column if not exists autorizado_por uuid;
alter table public.ra_membros add column if not exists autorizado_versao text;

create table if not exists public.ra_aceites (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid references public.ra_membros(id) on delete set null,   -- quem aceitou
  para_membro uuid references public.ra_membros(id) on delete set null, -- de quem são os dados (autorização do responsável)
  quem_nome text,                                                     -- guardado para o registro continuar legível
  documento text not null check (documento in ('termos', 'privacidade', 'autorizacao_responsavel', 'aviso_crianca')),
  versao text not null,
  aceito_em timestamptz not null default now()
);
create index if not exists ra_aceites_familia on public.ra_aceites(familia_id, aceito_em desc);
alter table public.ra_aceites enable row level security;
revoke all on public.ra_aceites from anon;
revoke insert, update, delete on public.ra_aceites from authenticated;
drop policy if exists ra_aceite_sel on public.ra_aceites;
create policy ra_aceite_sel on public.ra_aceites for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id() or para_membro = public.ra_meu_id()));

-- A pessoa logada registra o próprio aceite. Adulto: termos + privacidade. Criança ou adolescente: aviso_crianca.
create or replace function public.ra_aceitar(p_versao text, p_docs text[]) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); d text;
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if coalesce(p_versao, '') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Versão inválida'; end if;
  if coalesce(array_length(p_docs, 1), 0) = 0 then raise exception 'Marque as caixas para continuar'; end if;
  foreach d in array p_docs loop
    if d not in ('termos', 'privacidade', 'aviso_crianca') then raise exception 'Documento inválido'; end if;
    insert into public.ra_aceites(familia_id, membro_id, quem_nome, documento, versao) values (me.familia_id, me.id, me.nome, d, p_versao);
  end loop;
  update public.ra_membros set termos_versao = p_versao, termos_aceitos_em = now() where id = me.id;
end $$;

-- Pai ou Mãe autoriza o uso dos dados de uma criança ou adolescente do grupo (LGPD art. 14, §1º).
create or replace function public.ra_autorizar(p_membro uuid, p_versao text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); alvo public.ra_membros;
begin
  if me.id is null or me.papel <> 'gestor' then raise exception 'Apenas Pai ou Mãe'; end if;
  if coalesce(p_versao, '') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Versão inválida'; end if;
  select * into alvo from public.ra_membros where id = p_membro and familia_id = me.familia_id;
  if alvo.id is null then raise exception 'Pessoa não encontrada'; end if;
  insert into public.ra_aceites(familia_id, membro_id, para_membro, quem_nome, documento, versao)
  values (me.familia_id, me.id, alvo.id, me.nome || ' para ' || alvo.nome, 'autorizacao_responsavel', p_versao);
  update public.ra_membros set autorizado_em = now(), autorizado_por = me.id, autorizado_versao = p_versao where id = alvo.id;
end $$;
revoke execute on function public.ra_aceitar(text, text[]), public.ra_autorizar(uuid, text) from public, anon;
grant execute on function public.ra_aceitar(text, text[]), public.ra_autorizar(uuid, text) to authenticated;

-- B4 (preparação) E-mails do grupo só para Pai ou Mãe. A trava da coluna fica na parte 2 (0020), depois do app novo no ar.
create or replace function public.ra_emails_grupo() returns table(id uuid, email text)
language sql stable security definer set search_path = public as $$
  select m.id, m.email from public.ra_membros m
   where m.familia_id = public.ra_minha_familia() and public.ra_sou_gestor()
$$;
revoke execute on function public.ra_emails_grupo() from public, anon;
grant execute on function public.ra_emails_grupo() to authenticated;
