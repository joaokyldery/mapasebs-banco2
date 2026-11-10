
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.pontos_coleta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo_material TEXT NOT NULL,
    endereco TEXT,
    localizacao extensions.geometry(Point, 4326) NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pontos_localizacao
    ON public.pontos_coleta USING GIST (localizacao);

ALTER TABLE public.pontos_coleta ENABLE ROW LEVEL SECURITY;
