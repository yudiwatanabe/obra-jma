import { supabase } from './supabase';

// âââ CATEGORIES âââ
export async function fetchCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem');
  if (error) throw error;
  return data.map(c => ({ id: c.id, nome: c.nome, curto: c.curto }));
}

export async function upsertCategoria(cat) {
  const { error } = await supabase
    .from('categorias')
    .upsert({ id: cat.id, nome: cat.nome, curto: cat.curto, ordem: cat.ordem || 0 });
  if (error) throw error;
}

export async function deleteCategoria(id) {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
}

// âââ ORCAMENTO âââ
export async function fetchOrcamento() {
  const { data, error } = await supabase.from('orcamento').select('*');
  if (error) throw error;
  return Object.fromEntries(data.map(o => [o.cat_id, Number(o.valor)]));
}

export async function upsertOrcamento(catId, valor) {
  const { error } = await supabase
    .from('orcamento')
    .upsert({ cat_id: catId, valor });
  if (error) throw error;
}

export async function deleteOrcamento(catId) {
  const { error } = await supabase.from('orcamento').delete().eq('cat_id', catId);
  if (error) throw error;
}

// âââ FATURAS âââ
export async function fetchFaturas() {
  const { data: faturas, error: fe } = await supabase
    .from('faturas')
    .select('*')
    .order('created_at');
  if (fe) throw fe;

  const { data: alocs, error: ae } = await supabase
    .from('fatura_aloc')
    .select('*');
  if (ae) throw ae;

  const alocMap = {};
  for (const a of alocs) {
    if (!alocMap[a.fatura_id]) alocMap[a.fatura_id] = [];
    alocMap[a.fatura_id].push({ cat: a.cat_id, valor: Number(a.valor) });
  }

  return faturas.map(f => ({
    id: f.id,
    forn: f.forn || '',
    desc: f.descr || '',
    ndoc: f.ndoc || '',
    vc: f.vc != null ? Number(f.vc) : null,
    vf: Number(f.vf),
    st: f.st,
    dp: f.dp || null,
    de: f.de || null,
    aloc: alocMap[f.id] || [],
    obs: f.obs || '',
    link_nf: f.link_nf || '',
    link_comp: f.link_comp || '',
    link_contrato: f.link_contrato || '',
    prov_ids: f.prov_ids || [],
    revisado: f.revisado || null,
  }));
}

export async function saveFatura(f) {
  const isNew = !f._existing;
  const id = f.id;

  const row = {
    id,
    forn: f.forn || '',
    descr: f.desc || '',
    ndoc: f.ndoc || '',
    vc: f.vc,
    vf: f.vf || 0,
    st: f.st || 'Programado',
    dp: f.dp || null,
    de: f.de || null,
    obs: f.obs || '',
    link_nf: f.link_nf || '',
    link_comp: f.link_comp || '',
    link_contrato: f.link_contrato || '',
    prov_ids: f.prov_ids || [],
    revisado: f.revisado || null,
  };

  const { error } = await supabase.from('faturas').upsert(row);
  if (error) throw error;

  // Replace allocations
  await supabase.from('fatura_aloc').delete().eq('fatura_id', id);
  if (f.aloc && f.aloc.length > 0) {
    const { error: ae } = await supabase.from('fatura_aloc').insert(
      f.aloc.map(a => ({ fatura_id: id, cat_id: a.cat, valor: a.valor }))
    );
    if (ae) throw ae;
  }
}

export async function deleteFatura(id) {
  // alocs cascade
  const { error } = await supabase.from('faturas').delete().eq('id', id);
  if (error) throw error;
}

// âââ PROVISÃES âââ
export async function fetchProvisoes() {
  const { data: provs, error: pe } = await supabase
    .from('provisoes')
    .select('*')
    .order('created_at');
  if (pe) throw pe;

  const { data: alocs, error: ae } = await supabase
    .from('provisao_aloc')
    .select('*');
  if (ae) throw ae;

  const alocMap = {};
  for (const a of alocs) {
    if (!alocMap[a.provisao_id]) alocMap[a.provisao_id] = [];
    alocMap[a.provisao_id].push({ cat: a.cat_id, valor: Number(a.valor) });
  }

  return provs.map(p => ({
    id: p.id,
    forn: p.forn || '',
    desc: p.descr || '',
    ve: Number(p.ve),
    st: p.st,
    aloc: alocMap[p.id] || [],
    link_doc: p.link_doc || '',
    diluicao: p.diluicao || 'flat',
    flat_inicio: p.flat_inicio || '',
    flat_fim: p.flat_fim || '',
    custom_meses: p.custom_meses || [],
    revisado: p.revisado || null,
  }));
}

export async function saveProvisao(p) {
  const id = p.id;

  const row = {
    id,
    forn: p.forn || '',
    descr: p.desc || '',
    ve: p.ve || 0,
    st: p.st || 'Ativo',
    link_doc: p.link_doc || '',
    diluicao: p.diluicao || 'flat',
    flat_inicio: p.flat_inicio || '',
    flat_fim: p.flat_fim || '',
    custom_meses: p.custom_meses || [],
    revisado: p.revisado || null,
  };

  const { error } = await supabase.from('provisoes').upsert(row);
  if (error) throw error;

  // Replace allocations
  await supabase.from('provisao_aloc').delete().eq('provisao_id', id);
  if (p.aloc && p.aloc.length > 0) {
    const { error: ae } = await supabase.from('provisao_aloc').insert(
      p.aloc.map(a => ({ provisao_id: id, cat_id: a.cat, valor: a.valor }))
    );
    if (ae) throw ae;
  }
}

export async function deleteProvisao(id) {
  const { error } = await supabase.from('provisoes').delete().eq('id', id);
  if (error) throw error;
}

// âââ PROFILES âââ
export async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) return null;
  return data;
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function approveUser(userId, approved) {
  const { error } = await supabase
    .from('profiles')
    .update({ approved })
    .eq('id', userId);
  if (error) throw error;
}

export async function toggleAdmin(userId, isAdmin) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);
  if (error) throw error;
}
