-- âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- OBRA JMA â Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard â SQL Editor â New Query)
-- âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

-- 1) User profiles with approval system
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT DEFAULT '',
  approved BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, approved, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Categories
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  curto TEXT NOT NULL,
  orcado NUMERIC(14,2) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true)
);

-- 3) Faturas
CREATE TABLE public.faturas (
  id TEXT PRIMARY KEY,
  forn TEXT NOT NULL DEFAULT '',
  descr TEXT DEFAULT '',
  ndoc TEXT DEFAULT '',
  vc NUMERIC(14,2),
  vf NUMERIC(14,2) NOT NULL DEFAULT 0,
  st TEXT NOT NULL DEFAULT 'Programado',
  dp DATE,
  de DATE,
  obs TEXT DEFAULT '',
  link_nf TEXT DEFAULT '',
  link_comp TEXT DEFAULT '',
  link_contrato TEXT DEFAULT '',
  revisado DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faturas_all" ON public.faturas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true)
);

-- 4) Fatura allocations
CREATE TABLE public.fatura_aloc (
  id SERIAL PRIMARY KEY,
  fatura_id TEXT NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  cat TEXT NOT NULL REFERENCES public.categories(id),
  valor NUMERIC(14,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.fatura_aloc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatura_aloc_all" ON public.fatura_aloc FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true)
);

-- 5) Fatura-ProvisÃ£o links
CREATE TABLE public.fatura_prov (
  id SERIAL PRIMARY KEY,
  fatura_id TEXT NOT NULL REFERENCES public.faturas(id) ON DELETE CASCADE,
  prov_id TEXT NOT NULL
);

ALTER TABLE public.fatura_prov ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fatura_prov_all" ON public.fatura_prov FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true)
);

-- 6) ProvisÃµes
CREATE TABLE public.provisoes (
  id TEXT PRIMARY KEY,
  forn TEXT NOT NULL DEFAULT '',
  descr TEXT DEFAULT '',
  ve NUMERIC(14,2) NOT NULL DEFAULT 0,
  st TEXT NOT NULL DEFAULT 'Ativo',
  link_doc TEXT DEFAULT '',
  diluicao TEXT DEFAULT 'flat',
  flat_inicio TEXT DEFAULT '',
  flat_fim TEXT DEFAULT '',
  custom_meses JSONB DEFAULT '[]',
  revisado DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.provisoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provisoes_all" ON public.provisoes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true)
);

-- 7) ProvisÃ£o allocations
CREATE TABLE public.provisao_aloc (
  id SERIAL PRIMARY KEY,
  provisao_id TEXT NOT NULL REFERENCES public.provisoes(id) ON DELETE CASCADE,
  cat TEXT NOT NULL REFERENCES public.categories(id),
  valor NUMERIC(14,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.provisao_aloc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provisao_aloc_all" ON public.provisao_aloc FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approved = true)
);

-- 8) Indexes
CREATE INDEX idx_fatura_aloc_fatura ON public.fatura_aloc(fatura_id);
CREATE INDEX idx_fatura_aloc_cat ON public.fatura_aloc(cat);
CREATE INDEX idx_fatura_prov_fatura ON public.fatura_prov(fatura_id);
CREATE INDEX idx_provisao_aloc_prov ON public.provisao_aloc(provisao_id);
CREATE INDEX idx_provisao_aloc_cat ON public.provisao_aloc(cat);
CREATE INDEX idx_faturas_st ON public.faturas(st);
CREATE INDEX idx_provisoes_st ON public.provisoes(st);
