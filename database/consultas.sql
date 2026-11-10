
SELECT id, nome,
       extensions.ST_AsText(localizacao) AS ponto_wkt,
       extensions.ST_SRID(localizacao) AS srid
FROM public.pontos_coleta ORDER BY id;

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

SELECT id, nome, extensions.ST_AsText(localizacao) AS ponto_wkt
FROM public.pontos_coleta
WHERE extensions.ST_Intersects(
    localizacao,
    extensions.ST_MakeEnvelope(-38.24, -6.77, -38.22, -6.75, 4326)
)
ORDER BY id;

EXPLAIN SELECT id FROM public.pontos_coleta
WHERE extensions.ST_Intersects(
    localizacao,
    extensions.ST_MakeEnvelope(-38.24, -6.77, -38.22, -6.75, 4326)
);
