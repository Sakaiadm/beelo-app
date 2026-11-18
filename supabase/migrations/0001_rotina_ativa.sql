-- Rotina Ativa: esquema, regras de acesso (RLS) e funções.
-- Tabelas com prefixo ra_ para conviver com outros apps no mesmo projeto Supabase.

create extension if not exists pgcrypto;

-- ============ Tabelas ============
create table if not exists public.ra_familias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.ra_membros (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  email text unique,
  nome text not null check (char_length(nome) between 1 and 60),
  papel text not null check (papel in ('gestor','filho')),
  cor text not null default '#1a6fe0',
  ativo boolean not null default true,
  tela_ativo boolean not null default true,
  termos_aceitos_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists ra_membros_familia on public.ra_membros(familia_id);

create table if not exists public.ra_categorias (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 30),
  cor text not null default 'azul',
  ordem int not null default 0
);

create table if not exists public.ra_tarefas (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 100),
  descricao text check (char_length(descricao) <= 1000),
  categoria_id uuid references public.ra_categorias(id) on delete set null,
  responsavel_id uuid not null references public.ra_membros(id) on delete cascade,
  tipo text not null check (tipo in ('pontual','recorrente')),
  data_inicio date not null,
  data_fim date,
  recorrencia text check (recorrencia in ('diaria','dias_semana','semanal','mensal')),
  dias_semana int[] not null default '{}',
  hora_inicio time,
  hora_fim time,
  exige_foto boolean not null default false,
  criada_por uuid not null references public.ra_membros(id),
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists ra_tarefas_familia on public.ra_tarefas(familia_id);

create table if not exists public.ra_ocorrencias (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.ra_tarefas(id) on delete cascade,
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  data date not null,
  hora_inicio time,
  hora_fim time,
  horario_travado boolean not null default false,
  status text not null default 'pendente'
    check (status in ('pendente','cumprida','adiamento_pedido','adiada','cancelada')),
  concluida_em timestamptz,
  foto_path text,
  conferido text check (conferido in ('conferido','refazer')),
  justificativa text check (char_length(justificativa) <= 500),
  justificativa_status text check (justificativa_status in ('pendente','aceita','recusada')),
  justificada_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (tarefa_id, data)
);
create index if not exists ra_oc_membro_data on public.ra_ocorrencias(membro_id, data);
create index if not exists ra_oc_familia_data on public.ra_ocorrencias(familia_id, data);

create table if not exists public.ra_adiamentos (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null references public.ra_ocorrencias(id) on delete cascade,
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  nova_data date not null,
  nova_hora time,
  motivo text not null check (char_length(motivo) between 1 and 500),
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  resposta text check (char_length(resposta) <= 500),
  respondido_por uuid references public.ra_membros(id),
  respondido_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.ra_notificacoes (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  para_membro uuid not null references public.ra_membros(id) on delete cascade,
  titulo text not null,
  link text,
  lida boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists ra_notif_para on public.ra_notificacoes(para_membro, lida);

create table if not exists public.ra_tela_previsto (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  formato text not null check (formato in ('aparelho','total')),
  dias_semana int[] not null,
  vigencia_inicio date not null,
  vigencia_fim date,
  fixado boolean not null default false,
  min_celular int check (min_celular between 0 and 1440),
  min_computador int check (min_computador between 0 and 1440),
  min_total int check (min_total between 0 and 1440),
  origem text not null default 'pais' check (origem in ('pais','proposta')),
  criado_por uuid not null references public.ra_membros(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.ra_tela_proposta (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  data date not null,
  min_celular int check (min_celular between 0 and 1440),
  min_computador int check (min_computador between 0 and 1440),
  min_total int check (min_total between 0 and 1440),
  motivo text not null check (char_length(motivo) between 1 and 500),
  status text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  respondido_por uuid references public.ra_membros(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.ra_tela_real (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid not null references public.ra_membros(id) on delete cascade,
  data date not null,
  min_celular int check (min_celular between 0 and 1440),
  min_computador int check (min_computador between 0 and 1440),
  min_total int check (min_total between 0 and 2880),
  foto_celular text,
  foto_computador text,
  obs text check (char_length(obs) <= 300),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (membro_id, data)
);

create table if not exists public.ra_historico (
  id bigint generated always as identity primary key,
  familia_id uuid not null references public.ra_familias(id) on delete cascade,
  membro_id uuid references public.ra_membros(id) on delete set null,
  acao text not null,
  detalhe jsonb,
  criado_em timestamptz not null default now()
);

-- ============ Funções auxiliares ============
create or replace function public.ra_eu() returns public.ra_membros
language sql stable security definer set search_path = public as $$
  select * from public.ra_membros where user_id = auth.uid() and ativo limit 1
$$;

create or replace function public.ra_minha_familia() returns uuid
language sql stable security definer set search_path = public as $$
  select familia_id from public.ra_membros where user_id = auth.uid() and ativo limit 1
$$;

create or replace function public.ra_meu_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.ra_membros where user_id = auth.uid() and ativo limit 1
$$;

create or replace function public.ra_sou_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.ra_membros where user_id = auth.uid() and ativo and papel = 'gestor')
$$;

create or replace function public.ra_log(p_acao text, p_detalhe jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe)
  select familia_id, id, p_acao, p_detalhe from public.ra_membros where user_id = auth.uid() and ativo limit 1
$$;

create or replace function public.ra_notificar(p_familia uuid, p_para uuid, p_titulo text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_notificacoes(familia_id, para_membro, titulo, link) values (p_familia, p_para, p_titulo, p_link)
$$;

create or replace function public.ra_notificar_gestores(p_familia uuid, p_titulo text, p_link text) returns void
language sql security definer set search_path = public as $$
  insert into public.ra_notificacoes(familia_id, para_membro, titulo, link)
  select p_familia, id, p_titulo, p_link from public.ra_membros where familia_id = p_familia and papel = 'gestor' and ativo
$$;

-- Vincula o login (Google ou e-mail) ao membro convidado com o mesmo e-mail.
create or replace function public.ra_vincular() returns public.ra_membros
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(coalesce(auth.jwt() ->> 'email', '')); m public.ra_membros;
begin
  if auth.uid() is null or v_email = '' then return null; end if;
  select * into m from public.ra_membros where user_id = auth.uid();
  if found then return m; end if;
  update public.ra_membros set user_id = auth.uid()
   where lower(email) = v_email and user_id is null and ativo
   returning * into m;
  return m;
end $$;

-- Gera as ocorrências das tarefas no intervalo (idempotente).
create or replace function public.ra_gerar_ocorrencias(p_de date, p_ate date) returns void
language plpgsql security definer set search_path = public as $$
declare v_fam uuid := public.ra_minha_familia(); t record; d date;
begin
  if v_fam is null or p_ate < p_de or p_ate - p_de > 62 then return; end if;
  for t in select * from public.ra_tarefas where familia_id = v_fam and ativa loop
    if t.tipo = 'pontual' then
      if t.data_inicio between p_de and p_ate then
        insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data, hora_inicio, hora_fim, horario_travado)
        select t.id, t.familia_id, t.responsavel_id, t.data_inicio, t.hora_inicio, t.hora_fim,
               (t.hora_inicio is not null and t.criada_por <> t.responsavel_id)
        on conflict (tarefa_id, data) do nothing;
      end if;
    else
      d := greatest(p_de, t.data_inicio);
      while d <= p_ate and (t.data_fim is null or d <= t.data_fim) loop
        if (t.recorrencia = 'diaria')
           or (t.recorrencia = 'dias_semana' and extract(dow from d)::int = any(t.dias_semana))
           or (t.recorrencia = 'semanal' and extract(dow from d) = extract(dow from t.data_inicio))
           or (t.recorrencia = 'mensal' and extract(day from d) = extract(day from t.data_inicio)) then
          insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data, hora_inicio, hora_fim, horario_travado)
          values (t.id, t.familia_id, t.responsavel_id, d, t.hora_inicio, t.hora_fim,
                  (t.hora_inicio is not null and t.criada_por <> t.responsavel_id))
          on conflict (tarefa_id, data) do nothing;
        end if;
        d := d + 1;
      end loop;
    end if;
  end loop;
end $$;

-- ===== Ações do filho (conferem dono e regras no servidor) =====
create or replace function public.ra_concluir(p_oc uuid, p_foto text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas; me uuid := public.ra_meu_id(); fam uuid := public.ra_minha_familia();
begin
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = me;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if t.exige_foto and coalesce(p_foto,'') = '' then raise exception 'Esta tarefa exige foto'; end if;
  if p_foto is not null and p_foto not like fam::text || '/' || me::text || '/%' then raise exception 'Foto inválida'; end if;
  update public.ra_ocorrencias set status = 'cumprida', concluida_em = now(), foto_path = coalesce(p_foto, foto_path), conferido = null
   where id = p_oc;
  perform public.ra_log('concluir', jsonb_build_object('ocorrencia', p_oc));
end $$;

create or replace function public.ra_desfazer(p_oc uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.ra_ocorrencias set status = 'pendente', concluida_em = null
   where id = p_oc and membro_id = public.ra_meu_id() and status = 'cumprida' and conferido is null
     and concluida_em > now() - interval '1 day';
  if not found then raise exception 'Não é possível desfazer'; end if;
  perform public.ra_log('desfazer', jsonb_build_object('ocorrencia', p_oc));
end $$;

create or replace function public.ra_justificar(p_oc uuid, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if char_length(coalesce(p_texto,'')) < 3 then raise exception 'Escreva a justificativa'; end if;
  update public.ra_ocorrencias set justificativa = left(p_texto, 500), justificativa_status = 'pendente', justificada_em = now()
   where id = p_oc and membro_id = public.ra_meu_id() returning * into o;
  if not found then raise exception 'Tarefa não encontrada'; end if;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  perform public.ra_notificar_gestores(o.familia_id, (select nome from public.ra_membros where id = o.membro_id) || ' justificou: ' || t.titulo, '/painel');
  perform public.ra_log('justificar', jsonb_build_object('ocorrencia', p_oc));
end $$;

create or replace function public.ra_pedir_adiamento(p_oc uuid, p_data date, p_hora time, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if char_length(coalesce(p_motivo,'')) < 3 then raise exception 'Escreva o motivo'; end if;
  if p_data < (now() at time zone 'America/Sao_Paulo')::date then raise exception 'A nova data deve ser hoje ou depois'; end if;
  select * into o from public.ra_ocorrencias where id = p_oc and membro_id = public.ra_meu_id() and status in ('pendente');
  if not found then raise exception 'Não é possível pedir adiamento'; end if;
  insert into public.ra_adiamentos(ocorrencia_id, familia_id, membro_id, nova_data, nova_hora, motivo)
  values (p_oc, o.familia_id, o.membro_id, p_data, p_hora, left(p_motivo, 500));
  update public.ra_ocorrencias set status = 'adiamento_pedido' where id = p_oc;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  perform public.ra_notificar_gestores(o.familia_id, (select nome from public.ra_membros where id = o.membro_id) || ' pediu adiamento: ' || t.titulo, '/painel');
  perform public.ra_log('pedir_adiamento', jsonb_build_object('ocorrencia', p_oc, 'nova_data', p_data));
end $$;

create or replace function public.ra_definir_horario(p_oc uuid, p_inicio time, p_fim time) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_fim is not null and p_inicio is not null and p_fim <= p_inicio then raise exception 'Fim deve ser depois do início'; end if;
  update public.ra_ocorrencias set hora_inicio = p_inicio, hora_fim = p_fim
   where id = p_oc and (
     (membro_id = public.ra_meu_id() and not horario_travado)
     or (public.ra_sou_gestor() and familia_id = public.ra_minha_familia()));
  if not found then raise exception 'Horário definido pelos pais: peça adiamento'; end if;
end $$;

-- ===== Ações do gestor =====
create or replace function public.ra_responder_adiamento(p_id uuid, p_aprovar boolean, p_resposta text) returns void
language plpgsql security definer set search_path = public as $$
declare a public.ra_adiamentos; o public.ra_ocorrencias; t public.ra_tarefas;
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  select * into a from public.ra_adiamentos where id = p_id and familia_id = public.ra_minha_familia() and status = 'pendente';
  if not found then raise exception 'Pedido não encontrado'; end if;
  update public.ra_adiamentos set status = case when p_aprovar then 'aprovado' else 'recusado' end,
    resposta = left(p_resposta, 500), respondido_por = public.ra_meu_id(), respondido_em = now() where id = p_id;
  select * into o from public.ra_ocorrencias where id = a.ocorrencia_id;
  select * into t from public.ra_tarefas where id = o.tarefa_id;
  if p_aprovar then
    update public.ra_ocorrencias set status = 'adiada' where id = o.id;
    insert into public.ra_ocorrencias(tarefa_id, familia_id, membro_id, data, hora_inicio, hora_fim, horario_travado)
    values (o.tarefa_id, o.familia_id, o.membro_id, a.nova_data, coalesce(a.nova_hora, o.hora_inicio),
            case when a.nova_hora is null then o.hora_fim else null end, o.horario_travado)
    on conflict (tarefa_id, data) do update set status = 'pendente';
  else
    update public.ra_ocorrencias set status = 'pendente' where id = o.id;
  end if;
  perform public.ra_notificar(o.familia_id, o.membro_id,
    'Adiamento ' || case when p_aprovar then 'aprovado' else 'recusado' end || ': ' || t.titulo, '/hoje');
  perform public.ra_log('responder_adiamento', jsonb_build_object('adiamento', p_id, 'aprovado', p_aprovar));
end $$;

create or replace function public.ra_avaliar_justificativa(p_oc uuid, p_aceitar boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  update public.ra_ocorrencias set justificativa_status = case when p_aceitar then 'aceita' else 'recusada' end
   where id = p_oc and familia_id = public.ra_minha_familia();
  perform public.ra_log('avaliar_justificativa', jsonb_build_object('ocorrencia', p_oc, 'aceita', p_aceitar));
end $$;

create or replace function public.ra_conferir(p_oc uuid, p_valor text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.ra_ocorrencias;
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  update public.ra_ocorrencias set conferido = p_valor,
    status = case when p_valor = 'refazer' then 'pendente' else status end
   where id = p_oc and familia_id = public.ra_minha_familia() returning * into o;
  if p_valor = 'refazer' then
    perform public.ra_notificar(o.familia_id, o.membro_id, 'Refazer: ' || (select titulo from public.ra_tarefas where id = o.tarefa_id), '/hoje');
  end if;
  perform public.ra_log('conferir', jsonb_build_object('ocorrencia', p_oc, 'valor', p_valor));
end $$;

-- Notifica o filho quando os pais criam tarefa para ele.
create or replace function public.ra_tg_tarefa_nova() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.criada_por <> new.responsavel_id then
    perform public.ra_notificar(new.familia_id, new.responsavel_id, 'Nova tarefa: ' || new.titulo, '/hoje');
  else
    perform public.ra_notificar_gestores(new.familia_id,
      (select nome from public.ra_membros where id = new.responsavel_id) || ' criou a tarefa: ' || new.titulo, '/tarefas');
  end if;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe)
  values (new.familia_id, new.criada_por, 'criar_tarefa', jsonb_build_object('tarefa', new.id, 'titulo', new.titulo));
  return new;
end $$;
drop trigger if exists ra_tarefa_nova on public.ra_tarefas;
create trigger ra_tarefa_nova after insert on public.ra_tarefas for each row execute function public.ra_tg_tarefa_nova();

-- Tempo de tela: previsto vigente para um dia.
create or replace function public.ra_tela_previsto_dia(p_membro uuid, p_data date)
returns table(formato text, min_celular int, min_computador int, min_total int, fixado boolean)
language sql stable security definer set search_path = public as $$
  select p.formato, p.min_celular, p.min_computador,
         coalesce(p.min_total, coalesce(p.min_celular,0) + coalesce(p.min_computador,0)), p.fixado
    from public.ra_tela_previsto p
   where p.membro_id = p_membro
     and p.familia_id = public.ra_minha_familia()
     and p.vigencia_inicio <= p_data and (p.vigencia_fim is null or p.vigencia_fim >= p_data)
     and extract(dow from p_data)::int = any(p.dias_semana)
   order by (p.vigencia_inicio = p.vigencia_fim) desc, p.criado_em desc
   limit 1
$$;

create or replace function public.ra_propor_tela(p_data date, p_cel int, p_pc int, p_total int, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu();
begin
  if me.id is null or me.papel <> 'filho' then raise exception 'Apenas filhos'; end if;
  if char_length(coalesce(p_motivo,'')) < 3 then raise exception 'Escreva o motivo'; end if;
  insert into public.ra_tela_proposta(familia_id, membro_id, data, min_celular, min_computador, min_total, motivo)
  values (me.familia_id, me.id, p_data, p_cel, p_pc, p_total, left(p_motivo, 500));
  perform public.ra_notificar_gestores(me.familia_id, me.nome || ' propôs outro previsto de tela', '/tela');
end $$;

create or replace function public.ra_responder_tela(p_id uuid, p_aprovar boolean) returns void
language plpgsql security definer set search_path = public as $$
declare pr public.ra_tela_proposta;
begin
  if not public.ra_sou_gestor() then raise exception 'Apenas pais'; end if;
  update public.ra_tela_proposta set status = case when p_aprovar then 'aprovado' else 'recusado' end, respondido_por = public.ra_meu_id()
   where id = p_id and familia_id = public.ra_minha_familia() and status = 'pendente' returning * into pr;
  if not found then raise exception 'Proposta não encontrada'; end if;
  if p_aprovar then
    insert into public.ra_tela_previsto(familia_id, membro_id, formato, dias_semana, vigencia_inicio, vigencia_fim, fixado,
      min_celular, min_computador, min_total, origem, criado_por)
    values (pr.familia_id, pr.membro_id, case when pr.min_total is not null then 'total' else 'aparelho' end,
      array[extract(dow from pr.data)::int], pr.data, pr.data, false, pr.min_celular, pr.min_computador, pr.min_total, 'proposta', public.ra_meu_id());
  end if;
  perform public.ra_notificar(pr.familia_id, pr.membro_id, 'Previsto de tela ' || case when p_aprovar then 'aprovado' else 'recusado' end, '/tela');
end $$;

create or replace function public.ra_tg_tela_real() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if not public.ra_sou_gestor() and old.data < (now() at time zone 'America/Sao_Paulo')::date - 1 then
      raise exception 'Prazo de correção encerrado; peça aos pais';
    end if;
    new.atualizado_em := now();
  end if;
  insert into public.ra_historico(familia_id, membro_id, acao, detalhe)
  values (new.familia_id, public.ra_meu_id(), 'tela_real_' || lower(tg_op),
          jsonb_build_object('data', new.data, 'cel', new.min_celular, 'pc', new.min_computador, 'total', new.min_total));
  return new;
end $$;
drop trigger if exists ra_tela_real_tg on public.ra_tela_real;
create trigger ra_tela_real_tg before insert or update on public.ra_tela_real for each row execute function public.ra_tg_tela_real();

-- ============ RLS ============
alter table public.ra_familias enable row level security;
alter table public.ra_membros enable row level security;
alter table public.ra_categorias enable row level security;
alter table public.ra_tarefas enable row level security;
alter table public.ra_ocorrencias enable row level security;
alter table public.ra_adiamentos enable row level security;
alter table public.ra_notificacoes enable row level security;
alter table public.ra_tela_previsto enable row level security;
alter table public.ra_tela_proposta enable row level security;
alter table public.ra_tela_real enable row level security;
alter table public.ra_historico enable row level security;

create policy ra_fam_sel on public.ra_familias for select using (id = public.ra_minha_familia());
create policy ra_fam_upd on public.ra_familias for update using (id = public.ra_minha_familia() and public.ra_sou_gestor());

create policy ra_mem_sel on public.ra_membros for select using (familia_id = public.ra_minha_familia());
create policy ra_mem_ins on public.ra_membros for insert with check (familia_id = public.ra_minha_familia() and public.ra_sou_gestor());
create policy ra_mem_upd on public.ra_membros for update using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor())
  with check (familia_id = public.ra_minha_familia());

create policy ra_cat_sel on public.ra_categorias for select using (familia_id = public.ra_minha_familia());
create policy ra_cat_all on public.ra_categorias for all using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor())
  with check (familia_id = public.ra_minha_familia() and public.ra_sou_gestor());

create policy ra_tar_sel on public.ra_tarefas for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or responsavel_id = public.ra_meu_id()));
create policy ra_tar_ins on public.ra_tarefas for insert with check (
  familia_id = public.ra_minha_familia() and criada_por = public.ra_meu_id()
  and (public.ra_sou_gestor() or responsavel_id = public.ra_meu_id()));
create policy ra_tar_upd on public.ra_tarefas for update using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or (criada_por = public.ra_meu_id() and responsavel_id = public.ra_meu_id())))
  with check (familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or responsavel_id = public.ra_meu_id()));
create policy ra_tar_del on public.ra_tarefas for delete using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or (criada_por = public.ra_meu_id() and responsavel_id = public.ra_meu_id())));

create policy ra_oc_sel on public.ra_ocorrencias for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));
create policy ra_oc_upd on public.ra_ocorrencias for update using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor())
  with check (familia_id = public.ra_minha_familia());

create policy ra_adi_sel on public.ra_adiamentos for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));

create policy ra_not_sel on public.ra_notificacoes for select using (para_membro = public.ra_meu_id());
create policy ra_not_upd on public.ra_notificacoes for update using (para_membro = public.ra_meu_id()) with check (para_membro = public.ra_meu_id());

create policy ra_tp_sel on public.ra_tela_previsto for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));
create policy ra_tp_all on public.ra_tela_previsto for all using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor())
  with check (familia_id = public.ra_minha_familia() and public.ra_sou_gestor() and criado_por = public.ra_meu_id());

create policy ra_tpr_sel on public.ra_tela_proposta for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));

create policy ra_tr_sel on public.ra_tela_real for select using (
  familia_id = public.ra_minha_familia() and (public.ra_sou_gestor() or membro_id = public.ra_meu_id()));
create policy ra_tr_ins on public.ra_tela_real for insert with check (
  familia_id = public.ra_minha_familia() and (membro_id = public.ra_meu_id() or public.ra_sou_gestor()));
create policy ra_tr_upd on public.ra_tela_real for update using (
  familia_id = public.ra_minha_familia() and (membro_id = public.ra_meu_id() or public.ra_sou_gestor()))
  with check (familia_id = public.ra_minha_familia());

create policy ra_hist_sel on public.ra_historico for select using (familia_id = public.ra_minha_familia() and public.ra_sou_gestor());

-- Funções: só usuários logados executam.
revoke execute on all functions in schema public from anon;
do $$ declare f text; begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'ra\_%' loop
    execute 'revoke execute on function ' || f || ' from public, anon';
    execute 'grant execute on function ' || f || ' to authenticated';
  end loop;
end $$;
revoke execute on function public.ra_notificar(uuid, uuid, text, text) from authenticated;
revoke execute on function public.ra_notificar_gestores(uuid, text, text) from authenticated;
revoke execute on function public.ra_log(text, jsonb) from authenticated;

-- ============ Fotos (bucket privado) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rotina-fotos', 'rotina-fotos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy ra_foto_ins on storage.objects for insert to authenticated with check (
  bucket_id = 'rotina-fotos'
  and (storage.foldername(name))[1] = public.ra_minha_familia()::text
  and (storage.foldername(name))[2] = public.ra_meu_id()::text);
create policy ra_foto_sel on storage.objects for select to authenticated using (
  bucket_id = 'rotina-fotos'
  and (storage.foldername(name))[1] = public.ra_minha_familia()::text
  and (public.ra_sou_gestor() or (storage.foldername(name))[2] = public.ra_meu_id()::text));

-- ============ Dados iniciais ============
do $$ declare fam uuid; g uuid; e uuid; a uuid;
begin
  if exists(select 1 from public.ra_familias) then return; end if;
  insert into public.ra_familias(nome) values ('Nossa família') returning id into fam;
  insert into public.ra_membros(familia_id, email, nome, papel, cor) values (fam, 'sakaiadm2@gmail.com', 'Thomas', 'gestor', '#0f4fae') returning id into g;
  insert into public.ra_membros(familia_id, email, nome, papel, cor) values (fam, null, 'Mãe', 'gestor', '#7a3fb0');
  insert into public.ra_membros(familia_id, email, nome, papel, cor) values (fam, null, 'Eduardo', 'filho', '#1a6fe0') returning id into e;
  insert into public.ra_membros(familia_id, email, nome, papel, cor) values (fam, null, 'Alice', 'filho', '#c2185b') returning id into a;
  insert into public.ra_categorias(familia_id, nome, cor, ordem) values
    (fam,'Casa','laranja',1),(fam,'Estudo','indigo',2),(fam,'Esporte','verde',3),(fam,'Saúde','vermelho',4),
    (fam,'Lazer','azul',5),(fam,'Social','rosa',6),(fam,'Recados/Rua','teal',7),(fam,'Música/Cursos','roxo',8),(fam,'Outros','cinza',9);
end $$;
