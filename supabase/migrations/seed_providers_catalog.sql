-- ============================================================================
-- Seed de datos demo: 20 proveedores + 20 tintas + 20 papeles
-- Datos realistas para la industria de etiquetas / impresión flexográfica.
--
-- Uso:
--   psql "$DATABASE_URL" -f supabase/seed_providers_catalog.sql
--   (o pegar en el SQL Editor de Supabase)
--
-- Los catálogos referencian a los proveedores por NOMBRE vía subquery, así que
-- el script es idempotente respecto a los IDs seriales: no importa en qué valor
-- esté la secuencia, los FK quedan bien enlazados.
--
-- El stock inicial (current_stock_*) arranca en 0 a propósito: las existencias
-- deben construirse desde el flujo real de la app (órdenes → recepciones →
-- inventario), no sembrarse a mano. min_stock_* sí lleva valores realistas.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) PROVEEDORES (20)
--    provider_type ∈ INK_SUPPLIER | PAPER_SUPPLIER | SUPPLY_SUPPLIER | BOTH
--    supply_types  ⊂ {INK, PAPER, SUPPLIES}
-- ----------------------------------------------------------------------------
insert into public.providers
  (name, email, phone, whatsapp, address, contact_person, provider_type, supply_types, latitude, longitude, enabled)
values
  -- Proveedores de TINTA --------------------------------------------------
  ('Sun Chemical México',            'ventas@sunchemical.mx',        '+52 33 3818 4500', '+52 33 1245 8800', 'Av. López Mateos Sur 5290, Zapopan, Jalisco',          'Ricardo Alvarado',   'INK_SUPPLIER',    array['INK'],            20.6210, -103.4170, true),
  ('Flint Group México',             'pedidos@flintgrp.com.mx',      '+52 55 5333 1200', '+52 55 2890 1144', 'Calz. de la Viga 1450, Iztacalco, CDMX',              'Mariana Quintero',   'INK_SUPPLIER',    array['INK'],            19.3870, -99.1190, true),
  ('Siegwerk de México',             'contacto@siegwerk.mx',         '+52 81 8123 7700', '+52 81 1567 3322', 'Av. Industrias 320, Apodaca, Nuevo León',             'Jorge Treviño',      'INK_SUPPLIER',    array['INK'],            25.7810, -100.1880, true),
  ('Toyo Ink México',                'ventas@toyoink.mx',            '+52 442 220 4455', '+52 442 118 7790', 'Parque Industrial Querétaro Nave 12, Querétaro',      'Patricia Rendón',    'INK_SUPPLIER',    array['INK'],            20.7110, -100.4450, true),
  ('INX International México',        'cotizaciones@inx.mx',          '+52 33 3666 9090', '+52 33 1422 6655', 'Av. del Bosque 1240, El Salto, Jalisco',              'Luis Fernando Gómez','INK_SUPPLIER',    array['INK'],            20.5180, -103.1790, true),
  ('Tintas Sánchez',                 'ventas@tintassanchez.com.mx',  '+52 55 5670 3311', '+52 55 3344 7788', 'Eje Central 88, Benito Juárez, CDMX',                 'Adriana Sánchez',    'INK_SUPPLIER',    array['INK'],            19.3760, -99.1530, true),
  ('Marabu México',                  'info@marabu.mx',               '+52 81 8345 1290', '+52 81 2099 5511', 'Av. Eugenio Garza Sada 3820, Monterrey, Nuevo León',  'Héctor Lozano',      'INK_SUPPLIER',    array['INK'],            25.6190, -100.2710, true),
  ('T&K Toka México',                'pedidos@tktoka.mx',            '+52 477 711 8800', '+52 477 152 4433', 'Blvd. Aeropuerto 540, León, Guanajuato',              'Verónica Padilla',   'INK_SUPPLIER',    array['INK'],            21.1190, -101.6740, true),

  -- Proveedores de PAPEL / SUSTRATO --------------------------------------
  ('UPM Raflatac México',            'ventas@upmraflatac.mx',        '+52 55 5089 7700', '+52 55 4011 2266', 'Av. Santa Fe 505, Cuajimalpa, CDMX',                  'Daniela Romero',     'PAPER_SUPPLIER',  array['PAPER'],          19.3590, -99.2740, true),
  ('Avery Dennison México',          'pedidos@averydennison.mx',     '+52 33 3884 6600', '+52 33 1377 9001', 'Periférico Sur 7800, Tlaquepaque, Jalisco',           'Emilio Cárdenas',    'PAPER_SUPPLIER',  array['PAPER'],          20.5980, -103.3540, true),
  ('Mondi México',                   'contacto@mondigroup.mx',       '+52 81 8156 2330', '+52 81 1880 4477', 'Av. Benito Juárez 1200, Guadalupe, Nuevo León',       'Sofía Maldonado',    'PAPER_SUPPLIER',  array['PAPER'],          25.6770, -100.2560, true),
  ('Ritrama México',                 'ventas@ritrama.mx',            '+52 442 215 6610', '+52 442 144 8822', 'Av. 5 de Febrero 2100, Querétaro',                    'Andrés Villalobos',  'PAPER_SUPPLIER',  array['PAPER'],          20.5760, -100.3990, true),
  ('Fasson Latinoamérica',           'pedidos@fasson.mx',            '+52 55 5740 9080', '+52 55 2611 3399', 'Av. Insurgentes Norte 1810, Gustavo A. Madero, CDMX', 'Claudia Ibarra',     'PAPER_SUPPLIER',  array['PAPER'],          19.4870, -99.1310, true),
  ('Arclad Etiquetas México',        'ventas@arclad.mx',             '+52 33 3145 7720', '+52 33 1900 5566', 'Av. Vallarta 6503, Zapopan, Jalisco',                 'Raúl Mendoza',       'PAPER_SUPPLIER',  array['PAPER'],          20.7030, -103.4080, true),
  ('Brenntag Papeles Especiales',    'papeles@brenntag.mx',          '+52 81 8040 3355', '+52 81 1422 9911', 'Carr. Miguel Alemán Km 16, Apodaca, Nuevo León',      'Gabriela Fuentes',   'PAPER_SUPPLIER',  array['PAPER'],          25.7400, -100.1350, true),
  ('Propinsa Sustratos',             'ventas@propinsa.com.mx',       '+52 477 770 2200', '+52 477 188 6633', 'Blvd. José María Morelos 980, León, Guanajuato',      'Fernando Reyes',     'PAPER_SUPPLIER',  array['PAPER'],          21.1280, -101.6850, true),

  -- Proveedores MIXTOS (tinta + papel) -----------------------------------
  ('Comercializadora Gráfica Integral','ventas@graficaintegral.mx',  '+52 33 3612 4400', '+52 33 1255 7733', 'Av. Revolución 1450, Guadalajara, Jalisco',           'Norma Espinoza',     'BOTH',            array['INK','PAPER'],    20.6520, -103.3490, true),
  ('Distribuidora Flexo Total',      'contacto@flexototal.mx',       '+52 55 5588 1900', '+52 55 3700 4488', 'Calz. Ermita Iztapalapa 2200, Iztapalapa, CDMX',      'Óscar Beltrán',      'BOTH',            array['INK','PAPER','SUPPLIES'], 19.3550, -99.0830, true),

  -- Proveedores de CONSUMIBLES / REFACCIONES -----------------------------
  ('Suministros Flexográficos del Bajío','ventas@flexobajio.mx',     '+52 442 280 5050', '+52 442 166 7711', 'Av. Tecnológico 410, Querétaro',                      'Karla Domínguez',    'SUPPLY_SUPPLIER', array['SUPPLIES'],       20.5910, -100.4060, true),
  ('Refacciones y Consumibles Anilox', 'ventas@aniloxmx.com',        '+52 81 8290 6644', '+52 81 1955 2200', 'Av. Churubusco 1100, Monterrey, Nuevo León',          'Iván Castillo',      'SUPPLY_SUPPLIER', array['SUPPLIES'],       25.6850, -100.2890, false);

-- ----------------------------------------------------------------------------
-- 2) CATÁLOGO DE TINTAS (20)
--    ink_type ∈ UV | WATER_BASED | SOLVENT
--    density  = volumen de anilox (cm³/m²) ; thickness no aplica
--    current_stock_kg = 0 → el inventario se llena vía recepciones
-- ----------------------------------------------------------------------------
insert into public.ink_catalog
  (code, name, description, provider_id, ink_type, color_code, density, viscosity, optical_density, prepress_pct, min_stock_kg, current_stock_kg, enabled)
values
  ('INK-UV-001', 'Cyan Proceso UV',        'Cuatricromía proceso, curado UV',        (select id from public.providers where name = 'Sun Chemical México'),     'UV',          '#00AEEF',  3.5, 22.0, 1.45, 18.0, 25.0, 0, true),
  ('INK-UV-002', 'Magenta Proceso UV',     'Cuatricromía proceso, curado UV',        (select id from public.providers where name = 'Sun Chemical México'),     'UV',          '#EC008C',  3.5, 22.5, 1.50, 18.0, 25.0, 0, true),
  ('INK-UV-003', 'Amarillo Proceso UV',    'Cuatricromía proceso, curado UV',        (select id from public.providers where name = 'Sun Chemical México'),     'UV',          '#FFF200',  3.5, 21.0, 1.20, 18.0, 25.0, 0, true),
  ('INK-UV-004', 'Negro Proceso UV',       'Cuatricromía proceso, curado UV',        (select id from public.providers where name = 'Sun Chemical México'),     'UV',          '#231F20',  4.0, 24.0, 1.85, 20.0, 30.0, 0, true),
  ('INK-SPT-005','Pantone 485 C Rojo',     'Color directo Pantone, base UV',         (select id from public.providers where name = 'Flint Group México'),      'UV',          '#D9272E',  4.5, 25.0, 1.60, 22.0, 15.0, 0, true),
  ('INK-SPT-006','Pantone 286 C Azul',     'Color directo Pantone, base UV',         (select id from public.providers where name = 'Flint Group México'),      'UV',          '#0033A0',  4.5, 25.5, 1.70, 22.0, 15.0, 0, true),
  ('INK-SPT-007','Pantone 354 C Verde',    'Color directo Pantone, base UV',         (select id from public.providers where name = 'Flint Group México'),      'UV',          '#00B140',  4.5, 24.5, 1.55, 22.0, 15.0, 0, true),
  ('INK-SPT-008','Pantone Reflex Blue',    'Color directo Pantone, base UV',         (select id from public.providers where name = 'Siegwerk de México'),      'UV',          '#001489',  4.5, 26.0, 1.80, 22.0, 12.0, 0, true),
  ('INK-WHT-009','Blanco Opaco UV',        'Blanco de alta cobertura para sustratos transparentes', (select id from public.providers where name = 'Siegwerk de México'), 'UV', '#FFFFFF', 8.0, 30.0, NULL, 0.0, 40.0, 0, true),
  ('INK-VAR-010','Barniz Brillante UV',    'Barniz de sobreimpresión alto brillo',   (select id from public.providers where name = 'Toyo Ink México'),         'UV',          NULL,       6.0, 28.0, NULL, 0.0, 35.0, 0, true),
  ('INK-VAR-011','Barniz Mate UV',         'Barniz de sobreimpresión acabado mate',  (select id from public.providers where name = 'Toyo Ink México'),         'UV',          NULL,       6.0, 27.5, NULL, 0.0, 30.0, 0, true),
  ('INK-SPT-012','Pantone 021 C Naranja',  'Color directo Pantone, base UV',         (select id from public.providers where name = 'INX International México'), 'UV',          '#FE5000',  4.5, 24.0, 1.40, 22.0, 12.0, 0, true),
  ('INK-SPT-013','Pantone Violet C',       'Color directo Pantone, base UV',         (select id from public.providers where name = 'INX International México'), 'UV',          '#440099',  4.5, 25.0, 1.65, 22.0, 12.0, 0, true),
  ('INK-MET-014','Plata Metálica UV',      'Tinta metálica plata, partícula fina',   (select id from public.providers where name = 'Marabu México'),           'UV',          '#C0C0C0',  7.0, 32.0, NULL, 0.0, 18.0, 0, true),
  ('INK-MET-015','Oro Metálico UV',        'Tinta metálica oro rico',                (select id from public.providers where name = 'Marabu México'),           'UV',          '#D4AF37',  7.0, 32.5, NULL, 0.0, 18.0, 0, true),
  ('INK-WB-016', 'Cyan Base Agua',         'Cuatricromía proceso base agua',         (select id from public.providers where name = 'T&K Toka México'),         'WATER_BASED', '#00AEEF',  3.0, 35.0, 1.35, 16.0, 20.0, 0, true),
  ('INK-WB-017', 'Magenta Base Agua',      'Cuatricromía proceso base agua',         (select id from public.providers where name = 'T&K Toka México'),         'WATER_BASED', '#EC008C',  3.0, 35.5, 1.40, 16.0, 20.0, 0, true),
  ('INK-WB-018', 'Blanco Base Agua',       'Blanco cobertura base agua para film',   (select id from public.providers where name = 'Distribuidora Flexo Total'),'WATER_BASED', '#FFFFFF',  7.5, 40.0, NULL, 0.0, 30.0, 0, true),
  ('INK-SLV-019','Negro Solvente',         'Tinta base solvente para BOPP',          (select id from public.providers where name = 'Tintas Sánchez'),          'SOLVENT',     '#231F20',  4.0, 18.0, 1.80, 18.0, 22.0, 0, true),
  ('INK-SLV-020','Cyan Solvente',          'Tinta base solvente para BOPP',          (select id from public.providers where name = 'Comercializadora Gráfica Integral'), 'SOLVENT', '#00AEEF', 4.0, 18.5, 1.42, 18.0, 22.0, 0, false);

-- ----------------------------------------------------------------------------
-- 3) CATÁLOGO DE PAPELES / SUSTRATOS (20)
--    substrate_category ∈ PAPER | FILM | LAMINATED | SYNTHETIC
--    stock_unit         ∈ m2 | m | kg
--    ink_compatibility  ⊂ {UV, WATER_BASED, SOLVENT}
--    thickness_mm       almacena el espesor en µm (convención del esquema)
--    current_stock_m2 = 0 → el inventario se llena vía recepciones
-- ----------------------------------------------------------------------------
insert into public.paper_catalog
  (code, name, description, provider_id, substrate_category, material, weight_gsm, thickness_mm, standard_width_m,
   ink_compatibility, bulk_cm3g, min_stock_m2, current_stock_m2, stock_unit, reel_diameter_mm, core_mm, enabled)
values
  ('PPR-001', 'Couché Brillante 80g',      'Papel estucado brillante autoadhesivo',     (select id from public.providers where name = 'UPM Raflatac México'),    'PAPER',     'Papel estucado',     80.0,  78.0, 0.330, array['UV','WATER_BASED'],        0.98, 5000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-002', 'Couché Mate 90g',           'Papel estucado mate autoadhesivo',          (select id from public.providers where name = 'UPM Raflatac México'),    'PAPER',     'Papel estucado',     90.0,  88.0, 0.330, array['UV','WATER_BASED'],        0.97, 5000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-003', 'Térmico ECO Top',           'Papel térmico protegido para báscula',      (select id from public.providers where name = 'Avery Dennison México'),  'PAPER',     'Papel térmico',      75.0,  72.0, 0.420, array['UV'],                     1.05, 4000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-004', 'Térmico Top Premium',       'Térmico de alta durabilidad',               (select id from public.providers where name = 'Avery Dennison México'),  'PAPER',     'Papel térmico',      80.0,  80.0, 0.420, array['UV'],                     1.04, 4000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-005', 'BOPP Blanco 50µm',          'Film polipropileno blanco perlado',         (select id from public.providers where name = 'Mondi México'),           'FILM',      'BOPP',               NULL,  50.0, 0.350, array['UV','SOLVENT'],           NULL, 6000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-006', 'BOPP Transparente 40µm',    'Film polipropileno transparente brillante', (select id from public.providers where name = 'Mondi México'),           'FILM',      'BOPP',               NULL,  40.0, 0.350, array['UV','SOLVENT'],           NULL, 6000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-007', 'BOPP Metalizado 50µm',      'Film metalizado efecto plata',              (select id from public.providers where name = 'Mondi México'),           'FILM',      'BOPP metalizado',    NULL,  50.0, 0.330, array['UV'],                     NULL, 3000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-008', 'PP Blanco 60µm',            'Polipropileno blanco mate',                 (select id from public.providers where name = 'Ritrama México'),         'FILM',      'PP',                 NULL,  60.0, 0.340, array['UV','WATER_BASED'],       NULL, 4000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-009', 'PE Blanco 85µm',            'Polietileno blanco flexible (squeeze)',     (select id from public.providers where name = 'Ritrama México'),         'FILM',      'PE',                 NULL,  85.0, 0.330, array['UV'],                     NULL, 3000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-010', 'Verjurado Crema 100g',      'Papel verjurado para vinos y licores',      (select id from public.providers where name = 'Fasson Latinoamérica'),   'PAPER',     'Papel verjurado',   100.0, 110.0, 0.320, array['UV'],                     1.15, 3000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-011', 'Estucado Semibrillante 78g','Papel semibrillante de bajo gramaje',       (select id from public.providers where name = 'Fasson Latinoamérica'),   'PAPER',     'Papel estucado',     78.0,  76.0, 0.330, array['UV','WATER_BASED'],       0.99, 4000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-012', 'Kraft Natural 90g',         'Papel kraft natural para etiqueta orgánica',(select id from public.providers where name = 'Arclad Etiquetas México'),'PAPER',     'Papel kraft',        90.0,  95.0, 0.330, array['WATER_BASED','UV'],       1.10, 3000.0, 0, 'm2', 600.0, 76.0, true),
  ('PPR-013', 'PET Transparente 36µm',     'Poliéster transparente alta resistencia',   (select id from public.providers where name = 'Arclad Etiquetas México'),'FILM',      'PET',                NULL,  36.0, 0.330, array['UV','SOLVENT'],           NULL, 4000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-014', 'Poliéster Plata 50µm',      'Poliéster metalizado plata para químicos',  (select id from public.providers where name = 'Brenntag Papeles Especiales'),'FILM','PET metalizado',    NULL,  50.0, 0.330, array['UV'],                     NULL, 2500.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-015', 'Vinil Blanco 100µm',        'Vinil blanco autoadhesivo permanente',      (select id from public.providers where name = 'Brenntag Papeles Especiales'),'SYNTHETIC','Vinil PVC',         NULL, 100.0, 0.310, array['UV','SOLVENT'],           NULL, 2000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-016', 'Vinil Transparente 80µm',   'Vinil transparente sin etiqueta aparente',  (select id from public.providers where name = 'Propinsa Sustratos'),     'SYNTHETIC', 'Vinil PVC',          NULL,  80.0, 0.310, array['UV','SOLVENT'],           NULL, 2000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-017', 'Sintético FasClear 60µm',   'Sustrato sintético no-label-look',          (select id from public.providers where name = 'Propinsa Sustratos'),     'SYNTHETIC', 'PP sintético',       NULL,  60.0, 0.330, array['UV'],                     NULL, 2500.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-018', 'Laminado Nylon/PE 95µm',    'Estructura laminada para sachet',           (select id from public.providers where name = 'Comercializadora Gráfica Integral'),'LAMINATED','Nylon/PE',    NULL,  95.0, 0.800, array['SOLVENT'],                NULL, 2000.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-019', 'Laminado PET/AL/PE 110µm',  'Triple laminado barrera para alimentos',    (select id from public.providers where name = 'Distribuidora Flexo Total'),'LAMINATED','PET/AL/PE',     NULL, 110.0, 0.800, array['SOLVENT'],                NULL, 1500.0, 0, 'm2', 700.0, 76.0, true),
  ('PPR-020', 'Cartulina Sulfatada 220g',  'Cartulina SBS para etiqueta colgante',      (select id from public.providers where name = 'Distribuidora Flexo Total'),'PAPER',  'Cartulina SBS',     220.0, 280.0, 0.700, array['UV','WATER_BASED'],       1.20, 1500.0, 0, 'm2', 600.0, 76.0, false);

commit;

-- Verificación rápida (opcional):
--   select provider_type, count(*) from public.providers group by 1;
--   select count(*) from public.ink_catalog  where current_stock_kg = 0;  -- 20
--   select count(*) from public.paper_catalog where current_stock_m2 = 0;  -- 20
