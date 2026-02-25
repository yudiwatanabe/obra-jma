import { supabase } from './db';

// ═══ CATEGORIES ═══
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data.map(c => ({
    id: c.id,
    nome: c.nome,
    curto: c.curto,
  }));
}

export async function fetchOrcamento() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, orcado');
  if (error) throw error;
  return Object.fromEntries(data.map(c => [c.id, Number(c.orcado)]));
}

export async function upsertCategory(cat, orcado) {
  const { error } = await supabase
    .from('categories')
    .upsert({
      id: cat.id,
      nome: cat.nome,
      curto: cat.curto,
      orcado: orcado ?? 0,
      sort_order: cat.sort_order ?? 99,
    });
  if (error) throw error;
}

export async function deleteCategory(catId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', catId);
  if (error) throw error;
}

// ═══ FATURAS ═══
export async function fetchFaturas() {
  const { data: faturas, error: e1 } = await supabase
    .from('faturas')
    .select('*')
    .order('created_at');
  if (e1) throw e1;

  const { data: alocs, error: e2 } = await supabase
    .from('fatura_aloc')
    .select('*');
  if (e2) throw e2;

  const { data: provLinks, error: e3 } = await supabase
    .from('fatura_prov')
    .select('*');
  if (e3) throw e3;

  return faturas.map(f => ({
    id: f.id,
    forn: f.forn,
    desc: f.descr,
    ndoc: f.ndoc,
    vc: f.vc ? Number(f.vc) : null,
    vf: Number(f.vf),
    st: f.st,
    dp: f.dp,
    de: f.de,
    obs: f.obs,
    link_nf: f.link_nf,
    link_comp: f.link_comp,
    link_contrato: f.link_contrato,
    revisado: f.revisado,
    aloc: alocs.filter(a => a.fatura_id === f.id).map(a => ({ cat: a.cat, valor: Number(a.valor) })),
    prov_ids: provLinks.filter(p => p.fatura_id === f.id).map(p => p.prov_id),
  }));
}

export async function saveFatura(f) {
  // Upsert main fatura
  const { error: e1 } = await supabase
    .from('faturas')
    .upsert({
      id: f.id,
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
      revisado: f.revisado || null,
      updated_at: new Date().toISOString(),
    });
  if (e1) throw e1;

  // Replace allocations
  await supabase.from('fatura_aloc').delete().eq('fatura_id', f.id);
  if (f.aloc && f.aloc.length > 0) {
    const { error: e2 } = await supabase
      .from('fatura_aloc')
      .insert(f.aloc.map(a => ({ fatura_id: f.id, cat: a.cat, valor: a.valor })));
    if (e2) throw e2;
  }

  // Replace prov links
  await supabase.from('fatura_prov').delete().eq('fatura_id', f.id);
  if (f.prov_ids && f.prov_ids.length > 0) {
    const { error: e3 } = await supabase
      .from('fatura_prov')
      .insert(f.prov_ids.map(pid => ({ fatura_id: f.id, prov_id: pid })));
    if (e3) throw e3;
  }
}

export async function deleteFatura(id) {
  // Cascading deletes handle aloc and prov links
  const { error } = await supabase.from('faturas').delete().eq('id', id);
  if (error) throw error;
}

// ═══ PROVISÕES ═══
export async function fetchProvisoes() {
  const { data: provs, error: e1 } = await supabase
    .from('provisoes')
    .select('*')
    .order('created_at');
  if (e1) throw e1;

  const { data: alocs, error: e2 } = await supabase
    .from('provisao_aloc')
    .select('*');
  if (e2) throw e2;

  return provs.map(p => ({
    id: p.id,
    forn: p.forn,
    desc: p.descr,
    ve: Number(p.ve),
    st: p.st,
    link_doc: p.link_doc,
    diluicao: p.diluicao,
    flat_inicio: p.flat_inicio,
    flat_fim: p.flat_fim,
    custom_meses: p.custom_meses || [],
    revisado: p.revisado,
    aloc: alocs.filter(a => a.provisao_id === p.id).map(a => ({ cat: a.cat, valor: Number(a.valor) })),
  }));
}

export async function saveProvisao(p) {
  const { error: e1 } = await supabase
    .from('provisoes')
    .upsert({
      id: p.id,
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
      updated_at: new Date().toISOString(),
    });
  if (e1) throw e1;

  // Replace allocations
  await supabase.from('provisao_aloc').delete().eq('provisao_id', p.id);
  if (p.aloc && p.aloc.length > 0) {
    const { error: e2 } = await supabase
      .from('provisao_aloc')
      .insert(p.aloc.map(a => ({ provisao_id: p.id, cat: a.cat, valor: a.valor })));
    if (e2) throw e2;
  }
}

export async function deleteProvisao(id) {
  const { error } = await supabase.from('provisoes').delete().eq('id', id);
  if (error) throw error;
}

// ═══ PROFILES ═══
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
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

export async function approveUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ approved: true })
    .eq('id', userId);
  if (error) throw error;
}

export async function revokeUser(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ approved: false })
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
