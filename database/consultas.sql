-- CICERO — consultas espaciais para estudar e demonstrar no SQL Editor.
-- Dados de exemplo: longitude -38.23, latitude -6.76.

-- 1. Mostrar coordenadas armazenadas como objeto geometry(Point,4326).
SELECT id, nome,
       extensions.ST_AsText(localizacao) AS ponto_wkt,
       extensions.ST_SRID(localizacao) AS srid
FROM public.pontos_coleta ORDER BY id;

-- 2. Pontos a ate 2 km da posicao de referencia (distancia em metros).
SELECT id, nome,
       ROUND(extensions.ST_Distance(
          localizacao::extensions.geography,
          extensions.ST_SetSRID(extensions.ST_MakePoint(-38.23, -6.76), 4326)::extensions.geography
       )::numeric) AS distancia_metros
FROM public.pontos_coleta
WHERE extensions.ST_DWithin(
    localizacao::extensions.geography,
    extensions.ST_SetSRID(extensions.ST_MakePoint(-38.23, -6.76), 4326)::extensions.geography,
    2000
)
ORDER BY distancia_metros ASC;

-- 3. Pontos somente dentro do retangulo visivel do mapa.
-- ST_MakeEnvelope(oeste, sul, leste, norte, SRID).
SELECT id, nome, extensions.ST_AsText(localizacao) AS ponto_wkt
FROM public.pontos_coleta
WHERE extensions.ST_Intersects(
    localizacao,
    extensions.ST_MakeEnvelope(-38.24, -6.77, -38.22, -6.75, 4326)
)
ORDER BY id;

-- 4. Explicar o plano de consulta para o indice espacial.
EXPLAIN SELECT id FROM public.pontos_coleta
WHERE extensions.ST_Intersects(
    localizacao,
    extensions.ST_MakeEnvelope(-38.24, -6.77, -38.22, -6.75, 4326)
);
-- IMPORTANTE: banco pequeno pode optar por Sequential Scan; isso nao significa erro.
