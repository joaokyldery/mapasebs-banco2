-- CICERO — testes SQL sem criar, editar ou excluir registros.
-- Execute no SQL Editor apos schema.sql e habilitacao do PostGIS.

-- Todas as verificacoes de configuracao devem retornar TRUE.
SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='postgis') AS postgis_ativo;
SELECT to_regclass('public.pontos_coleta') IS NOT NULL AS tabela_existe;
SELECT EXISTS(
  SELECT 1 FROM pg_indexes
  WHERE schemaname='public' AND tablename='pontos_coleta'
    AND indexname='idx_pontos_localizacao'
) AS indice_espacial_existe;
SELECT EXISTS(
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='pontos_coleta' AND c.relrowsecurity
) AS rls_ativo;

-- As consultas abaixo devem retornar TRUE, TRUE e FALSE, respectivamente.
WITH ponto AS (
  SELECT extensions.ST_SetSRID(extensions.ST_MakePoint(-38.23, -6.76),4326) AS geom
)
SELECT
  extensions.ST_SRID(geom)=4326 AS srid_correto,
  extensions.ST_Intersects(geom, extensions.ST_MakeEnvelope(-38.24,-6.77,-38.22,-6.75,4326)) AS dentro_area,
  extensions.ST_Intersects(geom, extensions.ST_MakeEnvelope(-39,-7.2,-38.9,-7.1,4326)) AS fora_area
FROM ponto;

-- Mostra quantos pontos de coleta existem (pode ser zero).
SELECT COUNT(*) AS pontos_cadastrados FROM public.pontos_coleta;
