-- âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
-- OBRA JMA â Seed Data
-- Run AFTER migration.sql in Supabase SQL Editor
-- âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

-- Categories
INSERT INTO public.categories (id, nome, curto, orcado, sort_order) VALUES
('c01','Obra (Civil, Elec, Hidr, A/C, Revest.)','Obra Civil',2059367,1),
('c02','InstalaÃ§Ãµes Combate IncÃªndio','IncÃªndio',142203,2),
('c03','IluminaÃ§Ã£o','IluminaÃ§Ã£o',231470,3),
('c04','EletrodomÃ©sticos','Eletrodom.',48015,4),
('c05','Rev. Atenuadores AcÃºsticos','Aten. AcÃºst.',89600,5),
('c06','Marcenaria e Cabines','Marcenaria',717831,6),
('c07','DivisÃ³rias Banheiros','Div. Banh.',0,7),
('c08','MobiliÃ¡rio','MobiliÃ¡rio',632610,8),
('c09','Vidro Duplo AcÃºstico','Vidro AcÃºst.',255838,9),
('c10','Persianas','Persianas',92000,10),
('c11','Paisagismo','Paisagismo',0,11),
('c12','Tapetes','Tapetes',78736.75,12),
('c13','PeÃ§as Decorativas','PeÃ§as Decor.',10000,13),
('c14','TVs','TVs',53010,14),
('c15','VideoconferÃªncia/WIFI/Facial','Videoconf.',288917,15),
('c16','Outros','Outros',0,16);

-- Faturas
INSERT INTO public.faturas (id,forn,descr,ndoc,vc,vf,st,dp,de,obs,link_nf,link_comp,link_contrato,revisado) VALUES
('f01','BMR','','NF: 134',NULL,16453,'Pago','2025-12-05','2025-12-05','Conforme mediÃ§Ã£o','https://drive.google.com/open?id=1kBkWj6TMPBZ3QsIcMREIX7NB73rBjaEQ&usp=drive_copy','','','2026-02-21'),
('f02','Soul Retail','ServiÃ§os arquitetura','NF: 327',NULL,19300,'Pago','2025-12-05','2025-12-05','','','','https://drive.google.com/drive/folders/1nrbW8lmwQBbnC5a3OsrwwMVUX9Y7r50H','2026-02-21'),
('f03','Isage ComÃ©rcio de MÃ³veis','Ambientes Profissionais','Contrato',222750,44550,'Programado','2026-02-28',NULL,'Parcela 3/5','','','https://drive.google.com/open?id=16tNe5X6LzM8xIn99HCZyyU7FnaOCuLCP&usp=drive_copy','2026-02-21'),
('f04','Isage ComÃ©rcio de MÃ³veis','Ambientes Profissionais','Contrato',222750,44550,'Programado','2026-03-31',NULL,'Parcela 4/5','','','https://drive.google.com/open?id=16tNe5X6LzM8xIn99HCZyyU7FnaOCuLCP&usp=drive_copy','2026-02-21'),
('f05','Isage ComÃ©rcio de MÃ³veis','Ambientes Profissionais','Contrato',222750,44550,'Pago','2026-01-13','2026-01-13','Parcela 1/5','','','https://drive.google.com/open?id=16tNe5X6LzM8xIn99HCZyyU7FnaOCuLCP&usp=drive_copy','2026-02-21'),
('f06','Luri','Cortina Rolo Motorizada','Contrato',98532,32844,'Pago',NULL,'2025-12-16','Parcela 1/3','','','https://drive.google.com/drive/folders/1lqiqgh1X51IAgpZLSe5hEU-9hyL01qIy','2026-02-21'),
('f07','NBR','Projetos TÃ©cnicos Complementares','3039',9385,9385,'Pago','2025-12-16','2025-12-16','','https://drive.google.com/open?id=1fKN3IFDpvf26QS-4hvWLNv1eA5TwApUZ&usp=drive_copy','','','2026-02-21'),
('f08','NBR','Projetos TÃ©cnicos Complementares','NF: 3062',9385,2346.25,'Pago','2026-01-15','2026-01-14','','https://drive.google.com/open?id=13XM6DpVMvtLiRgVY48pHBzrmll9T3Adc&usp=drive_copy','','','2026-02-21'),
('f09','BMR','Gerenciamento de PrÃ© Projeto','NF: 149',NULL,13624.31,'Pago','2026-01-15','2026-01-15','','https://drive.google.com/open?id=1cCw72CKrT6hXypGuBYicS37Gkf6XakA-&usp=drive_copy','','','2026-02-21'),
('f10','BMR','EvoluÃ§Ã£o de obra 30%','NF: 143',2221981,666597,'Pago','2025-12-24','2025-12-24','Conforme mediÃ§Ã£o','https://drive.google.com/open?id=19uD-VIhdQmhiTEY5WRFfRmyM-Z8ht-z5&usp=drive_copy','','','2026-02-21'),
('f11','Kohler Experience','Torneira e Cuba cozinha','Pedido: 14759',NULL,14778,'Pago','2025-12-24','2025-12-24','','','','https://drive.google.com/drive/folders/1XB0ogNfwyrFHvvgrj_sTY4MRj37382hh','2026-02-21'),
('f12','Avanti','Conservador, Lava LouÃ§a, Refrigerador','Pedido 21155',43000,13000,'Pago','2025-12-24','2025-12-23','Parcela 1/2','','','https://drive.google.com/drive/folders/1EqwSTTOTigJYCLXl1KYt0NDZvweX5jKz','2026-02-21'),
('f13','Avanti','Conservador, Lava LouÃ§a, Refrigerador','Pedido 21155',43000,30000,'Pago','2026-01-15','2026-01-15','Parcela 2/2','','','https://drive.google.com/drive/folders/1EqwSTTOTigJYCLXl1KYt0NDZvweX5jKz','2026-02-21'),
('f14','BMR','Gerenciamento de PrÃ© Projeto','NF: 139',NULL,12782,'Pago','2026-01-15','2026-01-15','','https://drive.google.com/open?id=1eU-CUhSIV1NI6TUKTlopGQeRwxVvv7Jq&usp=drive_copy','','','2026-02-21'),
('f15','Hertz','DivisÃ³rias vidros acÃºsticos','Pedido: M3525',190000,95000,'Pago','2025-12-24','2026-01-13','Parcela 1/2','','','https://drive.google.com/drive/folders/1t8JTiJeRu9DfI-bSJzHUDJM9EPmTL9Je','2026-02-21'),
('f16','Luri','Cortina Rolo Motorizada','Contrato',98532,32844,'Pago','2026-01-15','2026-01-15','Parcela 2/3','','','https://drive.google.com/drive/folders/1lqiqgh1X51IAgpZLSe5hEU-9hyL01qIy','2026-02-21'),
('f17','Luri','Cortina Rolo Motorizada','Contrato',98532,32844,'Pago','2026-02-15','2026-02-13','Parcela 3/3','','','https://drive.google.com/drive/folders/1lqiqgh1X51IAgpZLSe5hEU-9hyL01qIy','2026-02-21'),
('f18','Icon Design','LuminÃ¡rias Arandela','Pedido: 1274001',40875,10219,'Pago','2026-01-01','2025-12-23','Parcela 1/4','','','https://drive.google.com/drive/folders/1eTXrEp3xYy-XDy-Kr3kN3xAcBsKpqTUU','2026-02-21'),
('f19','Icon Design','LuminÃ¡rias Arandela','Pedido: 1274001',40875,10219,'Pago','2026-01-27','2026-01-27','Parcela 2/4','','','https://drive.google.com/drive/folders/1eTXrEp3xYy-XDy-Kr3kN3xAcBsKpqTUU','2026-02-21'),
('f20','Artefacto','Mesas e cadeira','Pedido: F17608/32',32070,10690,'Programado','2026-02-28',NULL,'Parcela 2/3','','','https://drive.google.com/drive/folders/1LbZ_99wx9alCmCLdNnIukh2xR7Ap0THW','2026-02-21'),
('f21','Artefacto','Mesas e cadeira','Pedido: F17608/32',32070,10690,'Programado','2026-03-31',NULL,'Parcela 3/3','','','https://drive.google.com/drive/folders/1LbZ_99wx9alCmCLdNnIukh2xR7Ap0THW','2026-02-21'),
('f22','Isage ComÃ©rcio de MÃ³veis','Ambientes Profissionais','Contrato',222750,44550,'Pago','2026-01-30','2026-01-31','Parcela 2/5','','','https://drive.google.com/open?id=16tNe5X6LzM8xIn99HCZyyU7FnaOCuLCP&usp=drive_copy','2026-02-21'),
('f23','Nova Montadora','MÃ³veis Bontempo','Contrato',272250,54450,'Programado','2026-02-28',NULL,'Parcela 3/5','','','https://drive.google.com/drive/folders/1AT8s0-D6kKKU7R7Y3Q9pB3-lBC_VrgXp','2026-02-21'),
('f24','Nova Montadora','MÃ³veis Bontempo','Contrato',272250,54450,'Programado','2026-03-30',NULL,'Parcela 4/5','','','https://drive.google.com/drive/folders/1AT8s0-D6kKKU7R7Y3Q9pB3-lBC_VrgXp','2026-02-21'),
('f25','Nova Montadora','MÃ³veis Bontempo','Contrato',272250,54450,'Pago','2026-01-13','2026-01-13','Parcela 1/5','','','https://drive.google.com/drive/folders/1AT8s0-D6kKKU7R7Y3Q9pB3-lBC_VrgXp','2026-02-21'),
('f26','Nova Montadora','MÃ³veis Bontempo','Contrato',272250,54450,'Pago','2026-01-30','2026-01-30','Parcela 2/5','','','https://drive.google.com/drive/folders/1AT8s0-D6kKKU7R7Y3Q9pB3-lBC_VrgXp','2026-02-21'),
('f27','Pontocon Minimal','Electrix Linha+Esp','Pedido',491000,245000,'Pago','2025-11-12','2025-12-11','Parcela 1/2','','','https://drive.google.com/drive/folders/1Q3GwwC4edVBKNHj7AjuZ0eloTzCd_6JE','2026-02-21'),
('f28','VG Sistema','InstalaÃ§Ã£o rede SPK','NF: 527',36000,18000,'Pago','2026-01-20','2026-01-20','Parcela 1/2','https://drive.google.com/open?id=11-nxU48wufZcLj9UUn-CkkctzX-eU7CH&usp=drive_copy','','https://drive.google.com/open?id=1mEnDpA5qZ4RYVmR0-9UDU2gY2_saUrp8&usp=drive_copy','2026-02-21'),
('f29','VG Sistema','InstalaÃ§Ã£o rede SPK','NF: 531',36000,18000,'Programado','2026-02-18',NULL,'Parcela 2/2','https://drive.google.com/open?id=1g53tCkXzr_d6-B5srb4rC23MyK251vbQ&usp=drive_copy','','https://drive.google.com/open?id=1mEnDpA5qZ4RYVmR0-9UDU2gY2_saUrp8&usp=drive_copy','2026-02-21'),
('f30','Imperium','','NF: 11.377',40300,40300,'Pago','2026-01-23','2026-01-23','Integral','https://drive.google.com/open?id=18qSe_nfxzh8k_6LrZTYIawnA2-FoevIg&usp=drive_copy','','https://drive.google.com/open?id=1bNSSw_ALLDgKj8JlzmtcSoz-MDD_AhGb&usp=drive_copy','2026-02-21'),
('f31','Rivagesso','Placas de gesso','NF: 03',48000,48000,'Pago','2026-01-20','2026-01-20','Integral','https://drive.google.com/drive/folders/1X0nW7AKXs3VY3dPxNXZtqSeAM7AKJOw5','','','2026-02-21'),
('f32','AAC ar','Equipamentos','NF: 119.773',54999.99,27500,'Pago','2026-01-20','2026-01-21','Parcela 1/2','https://drive.google.com/drive/folders/1t-zEJ6ogOKT2wBLCXAqufMjEGGTRKWqX','','','2026-02-21'),
('f33','AAC ar','Equipamentos','NF: 119.773',54999.99,27500,'Pago','2026-02-12','2026-02-10','Parcela 2/2','https://drive.google.com/drive/folders/1t-zEJ6ogOKT2wBLCXAqufMjEGGTRKWqX','','','2026-02-21'),
('f34','ZECHI ClimatizaÃ§Ã£o','Instal. ar condicionado','NF: 89',160000,60000,'Pago','2026-01-21','2026-01-23','Parcela 1/4','','','','2026-02-21'),
('f35','ZECHI ClimatizaÃ§Ã£o','Instal. ar condicionado','NF: 89',160000,60000,'Pago','2026-02-02','2026-02-02','Parcela 2/4','','','','2026-02-21'),
('f36','ZECHI ClimatizaÃ§Ã£o','Instal. ar condicionado','NF: 89',160000,20000,'Programado','2026-02-28',NULL,'Parcela 3/4','','','','2026-02-21'),
('f37','ZECHI ClimatizaÃ§Ã£o','Instal. ar condicionado','NF: 89',160000,20000,'Programado','2026-02-28','2026-03-20','Parcela 4/4','','','','2026-02-21'),
('f38','Artefacto','Mesas e cadeira','Pedido: F17608/32',32070,10690,'Pago','2026-01-30','2026-01-30','Parcela 1/3','','','https://drive.google.com/drive/folders/1LbZ_99wx9alCmCLdNnIukh2xR7Ap0THW','2026-02-21'),
('f39','Boobam','Cadeira, Banqueta, Mesa, SofÃ¡','Pedido',69746,34873,'Pago','2026-01-28','2026-01-28','Parcela 1/2','','','https://drive.google.com/drive/folders/1hGPRwirZZYuJFAklvFEo-6oY2m82_nPe','2026-02-21'),
('f40','Adeilton Melo Pereira','MÃ£o de obra elÃ©trica','NF: 196',10000,10000,'Programado','2026-02-25',NULL,'Integral','https://drive.google.com/drive/folders/1bp1c9EFteJxmEvqLgiVfaza8oqiX16bt','','','2026-02-21'),
('f41','Fast Qualy','50% MO, 50% Material','NF: 2475',150000,150000,'Pago','2026-02-10','2026-02-10','Integral','https://drive.google.com/drive/folders/1M2QZ29U7O3TMnngW2ihpk7wrXNQEVPeK','','','2026-02-21'),
('f42','DSGlass','Conj. Mov. Auto. Vidro','NF: 511',20500,20500,'Pago','2026-02-10','2026-02-10','Integral','https://drive.google.com/drive/folders/1Tbv_WaGPA5u6DpErsSs3xK02J-nKluPH','','','2026-02-21');

-- Fatura allocations
INSERT INTO public.fatura_aloc (fatura_id, cat, valor) VALUES
('f01','c06',16453),('f02','c01',19300),('f03','c01',44550),('f04','c06',44550),
('f05','c06',44550),('f06','c10',32844),('f07','c01',9385),('f08','c01',2346.25),
('f09','c01',13624.31),('f10','c01',666597),('f11','c01',14778),('f12','c04',13000),
('f13','c04',30000),('f14','c01',12782),('f15','c09',95000),('f16','c10',32844),
('f17','c10',32844),('f18','c03',10219),('f19','c03',10219),('f20','c08',10690),
('f21','c08',10690),('f22','c06',44550),('f23','c06',54450),('f24','c06',54450),
('f25','c06',54450),('f26','c06',54450),('f27','c08',162567),('f27','c01',82433),
('f28','c02',18000),('f29','c02',18000),('f30','c01',40300),('f31','c01',48000),
('f32','c01',27500),('f33','c01',27500),('f34','c01',60000),('f35','c01',60000),
('f36','c01',20000),('f37','c01',20000),('f38','c08',10690),('f39','c08',34873),
('f40','c01',10000),('f41','c01',150000),('f42','c09',20500);

-- Fatura-ProvisÃ£o links
INSERT INTO public.fatura_prov (fatura_id, prov_id) VALUES
('f01','p01'),('f03','p02'),('f05','p02'),('f09','p01'),('f10','p01'),('f14','p01'),
('f15','p05'),('f18','p06'),('f19','p06'),('f20','p12'),('f21','p12'),('f22','p02'),
('f23','p03'),('f24','p03'),('f25','p03'),('f26','p03'),('f27','p04'),('f38','p12'),
('f39','p13');

-- ProvisÃµes
INSERT INTO public.provisoes (id,forn,descr,ve,st,link_doc,diluicao,flat_inicio,flat_fim,custom_meses,revisado) VALUES
('p01','BMR','Contrato geral de obra',2221981,'Ativo','','flat','2026-03','2026-06','[]','2026-02-21'),
('p02','Isage ComÃ©rcio de MÃ³veis','Ambientes Profissionais',222750,'Ativo','https://drive.google.com/open?id=16tNe5X6LzM8xIn99HCZyyU7FnaOCuLCP&usp=drive_copy','flat','2026-02','2026-05','[]','2026-02-21'),
('p03','Nova Montadora','MÃ³veis Bontempo',272250,'Ativo','https://drive.google.com/open?id=18wOlnwE0QBCowQs8T-hvhBZGmwbvyMOF&usp=drive_copy','flat','2026-04','2026-04','[]','2026-02-21'),
('p04','Pontocon Minimal','Electrix (escopo completo)',491000,'Ativo','https://drive.google.com/drive/folders/1Q3GwwC4edVBKNHj7AjuZ0eloTzCd_6JE','flat','2025-12','2026-06','[]','2026-02-21'),
('p05','Hertz','DivisÃ³rias vidros acÃºsticos',190000,'Ativo','https://drive.google.com/drive/folders/1t8JTiJeRu9DfI-bSJzHUDJM9EPmTL9Je','flat','2025-12','2026-03','[]','2026-02-21'),
('p06','Icon Design','LuminÃ¡rias Arandela',40875,'Ativo','https://drive.google.com/drive/folders/1eTXrEp3xYy-XDy-Kr3kN3xAcBsKpqTUU','flat','2026-01','2026-03','[]','2026-02-21'),
('p07','Pretti','Proposta cabeamento',30619.95,'Ativo','','flat','2026-02','2026-04','[]','2026-02-21'),
('p08','FLSEC','Equip. rede + videoconferÃªncia',51781.05,'Ativo','','flat','2026-02','2026-03','[]','2026-02-21'),
('p09','[A DEFINIR]','Computadores Sala (7)',35000,'Ativo','','flat','2026-03','2026-04','[]','2026-02-21'),
('p10','[A DEFINIR]','Acesso facial + No break',20000,'Ativo','','flat','2026-03','2026-04','[]','2026-02-21'),
('p11','[A DEFINIR]','2 TVs',11000,'Ativo','','flat','2026-03','2026-04','[]','2026-02-21'),
('p12','Artefacto','Mesas e cadeiras',32070,'Ativo','https://drive.google.com/drive/folders/1LbZ_99wx9alCmCLdNnIukh2xR7Ap0THW','flat','2026-02','2026-03','[]','2026-02-21'),
('p13','Boobam','Cadeira Linha, Banqueta Linha, Mesa Linha Baixa, SofÃ¡ AlgodÃ£o',69746,'Ativo','https://drive.google.com/drive/folders/1hGPRwirZZYuJFAklvFEo-6oY2m82_nPe','flat','2026-03','2026-03','[]','2026-02-21');

-- ProvisÃ£o allocations
INSERT INTO public.provisao_aloc (provisao_id, cat, valor) VALUES
('p01','c01',1890684),('p01','c02',134548),('p01','c04',5086),('p01','c05',30325),('p01','c09',38796),('p01','c06',122542),
('p02','c06',222750),
('p03','c06',272250),
('p04','c08',325134),('p04','c06',165866),
('p05','c09',190000),
('p06','c03',40875),
('p07','c15',30619.95),
('p08','c15',51781.05),
('p09','c15',35000),
('p10','c15',20000),
('p11','c14',11000),
('p12','c08',32070),
('p13','c08',69746);
