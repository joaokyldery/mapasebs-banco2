-- CICERO — OPCIONAL: cadastros FICTICIOS para uma demonstracao.
-- Nao apresente estes locais como pontos de coleta reais.
-- Nao execute se preferir usar somente registros cadastrados no frontend.
INSERT INTO public.pontos_coleta (nome, descricao, tipo_material, endereco, localizacao)
SELECT 'Ponto Didatico A', 'Exemplo ficticio para demonstracao', 'Papel e plastico', 'Local de exemplo',
       extensions.ST_SetSRID(extensions.ST_MakePoint(-38.23,-6.76),4326)
WHERE NOT EXISTS (SELECT 1 FROM public.pontos_coleta WHERE nome='Ponto Didatico A');

INSERT INTO public.pontos_coleta (nome, descricao, tipo_material, endereco, localizacao)
SELECT 'Ponto Didatico B', 'Exemplo ficticio para demonstracao', 'Vidro e metal', 'Local de exemplo',
       extensions.ST_SetSRID(extensions.ST_MakePoint(-38.25,-6.79),4326)
WHERE NOT EXISTS (SELECT 1 FROM public.pontos_coleta WHERE nome='Ponto Didatico B');
