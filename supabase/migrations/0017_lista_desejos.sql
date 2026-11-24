-- beelo · 0017 · Lista de desejos (beta, junto com Desafios e prêmios)
-- Rode DEPOIS do 0016. Só acrescenta campos à tabela de prêmios e duas funções; nada do que existe muda.
-- A criança (ou o adolescente) sugere um desejo; Pai ou Mãe aprovam com nome e preço, ou respondem "agora não" com carinho.
-- O desejo aprovado é um prêmio só daquela pessoa e vira a meta do cofrinho dela.

alter table public.ra_premios add column if not exists membro_id uuid references public.ra_membros(id) on delete cascade;
alter table public.ra_premios add column if not exists desejo text;
alter table public.ra_premios add column if not exists sugerido text;
alter table public.ra_premios add column if not exists foto text;
alter table public.ra_premios add column if not exists regra text;
alter table public.ra_premios add column if not exists resposta text;
alter table public.ra_premios add column if not exists respondido_em timestamptz;
alter table public.ra_premios drop constraint if exists ra_premios_desejo_ck;
alter table public.ra_premios add constraint ra_premios_desejo_ck check (desejo is null or desejo in ('esperando', 'aprovado', 'agora_nao'));
create index if not exists ra_premios_membro on public.ra_premios(membro_id) where membro_id is not null;

-- Sugerir um desejo (até 3 esperando por vez). Avisa Pai e Mãe.
create or replace function public.ra_desejo_sugerir(p_nome text, p_foto text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me public.ra_membros := public.ra_eu(); v_nome text := left(btrim(coalesce(p_nome, '')), 80); v_teen boolean; v_id uuid;
begin
  if me.id is null then raise exception 'Sem acesso'; end if;
  if me.papel <> 'filho' then raise exception 'Os desejos são sugeridos pelos filhos'; end if;
  if not coalesce((select desafios_beta from public.ra_familias where id = me.familia_id), false) then raise exception 'Os desafios estão desligados'; end if;
  if v_nome = '' then raise exception 'Escreva o que você quer'; end if;
  perform pg_advisory_xact_lock(hashtext('desejo' || me.id::text));
  if (select count(*) from public.ra_premios where membro_id = me.id and desejo = 'esperando') >= 3 then
    raise exception 'Você já tem 3 desejos esperando os pais. Espere a resposta de um deles.';
  end if;
  -- Foto só da pasta da própria pessoa.
  if p_foto is not null and p_foto not like me.familia_id::text || '/' || me.id::text || '/%' then p_foto := null; end if;
  v_teen := not coalesce(me.modo_crianca, false);
  insert into public.ra_premios(familia_id, nome, custo, moeda, faixa, ativo, membro_id, desejo, sugerido, foto)
  values (me.familia_id, v_nome, 1, case when v_teen then 'semanas' else 'estrelas' end, case when v_teen then 'teen' else 'todos' end,
          false, me.id, 'esperando', v_nome, nullif(p_foto, ''))
  returning id into v_id;
  perform public.ra_notificar_gestores(me.familia_id, me.nome || ' sugeriu um desejo: ' || v_nome, '/desafios');
  return v_id;
end $$;

-- Pai ou Mãe respondem: aprovar (com nome e preço) ou "agora não" (com uma mensagem carinhosa).
create or replace function public.ra_desejo_responder(p_id uuid, p_aprovar boolean, p_nome text, p_custo int, p_regra text, p_resposta text) returns void
language plpgsql security definer set search_path = public as $$
declare pr public.ra_premios; v_nome text;
begin
  if not public.ra_sou_gestor() then raise exception 'Só os responsáveis podem fazer isso'; end if;
  select * into pr from public.ra_premios where id = p_id and familia_id = public.ra_minha_familia() and desejo = 'esperando' for update;
  if not found then raise exception 'Este desejo já foi respondido'; end if;
  if p_aprovar then
    v_nome := coalesce(nullif(left(btrim(coalesce(p_nome, '')), 80), ''), pr.nome);
    if p_custo is null or p_custo < 1 or p_custo > 1000 then raise exception 'Escolha quanto o desejo vale'; end if;
    update public.ra_premios set nome = v_nome, custo = p_custo, ativo = true, desejo = 'aprovado',
           regra = nullif(left(btrim(coalesce(p_regra, '')), 200), ''), respondido_em = now()
     where id = pr.id;
    -- Vira a meta do cofrinho, a não ser que a pessoa já esteja juntando para outro desejo dela.
    update public.ra_membros m set cofrinho_meta = pr.id where m.id = pr.membro_id
       and (m.cofrinho_meta is null or not exists (select 1 from public.ra_premios x where x.id = m.cofrinho_meta and x.membro_id = m.id and x.ativo));
    perform public.ra_notificar(pr.familia_id, pr.membro_id, 'Os pais aprovaram seu desejo: ' || v_nome || '!', '/desafios/cofrinho');
  else
    update public.ra_premios set desejo = 'agora_nao', respondido_em = now(),
           resposta = coalesce(nullif(left(btrim(coalesce(p_resposta, '')), 200), ''), 'Que ideia legal! Vamos conversar sobre ela juntos.')
     where id = pr.id returning * into pr;
    perform public.ra_notificar(pr.familia_id, pr.membro_id, 'Sobre o desejo ' || pr.sugerido || ': ' || pr.resposta, '/desafios/cofrinho');
  end if;
end $$;

revoke execute on function public.ra_desejo_sugerir(text, text), public.ra_desejo_responder(uuid, boolean, text, int, text, text) from public, anon;
grant execute on function public.ra_desejo_sugerir(text, text), public.ra_desejo_responder(uuid, boolean, text, int, text, text) to authenticated;

notify pgrst, 'reload schema';
