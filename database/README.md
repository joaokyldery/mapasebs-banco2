# Banco de Dados / MapaSEBS — Cicero Arthur

O PostgreSQL fica no **Supabase** e usa a extensão **PostGIS** habilitada no schema `extensions`.

## Ordem de uso

1. No Supabase, abra **SQL Editor** e confirme que o PostGIS está habilitado em **Database → Extensions**.
2. Execute `schema.sql` (o projeto real já possui essa tabela, então não apague os dados).
3. Execute `testes.sql` e verifique os resultados booleanos.
4. Execute uma consulta por vez do arquivo `consultas.sql`, estudando o resultado.
5. `dados_exemplo.sql` é opcional e adiciona **apenas exemplos fictícios**.

## Campos

| Campo | Tipo | Motivo |
|---|---|---|
| id | BIGINT IDENTITY | Identificador |
| nome | TEXT | Nome do local |
| descricao | TEXT | Informação complementar |
| tipo_material | TEXT | Material recebido |
| endereco | TEXT | Endereço aproximado |
| localizacao | geometry(Point,4326) | Objeto espacial exigido na atividade |
| criado_em | TIMESTAMPTZ | Data do cadastro |

## Funções espaciais

- `ST_MakePoint(longitude, latitude)`: cria a geometria (ordem importante).
- `ST_SetSRID(geometria, 4326)`: define o sistema de referência WGS84.
- `ST_DWithin(geography, geography, raio)`: busca num raio em **metros**.
- `ST_Intersects(geometry, envelope)`: filtra os pontos dentro da área visível.
- `ST_MakeEnvelope(oeste, sul, leste, norte, 4326)`: cria uma região retangular.
- `ST_AsText`: mostra a geometria em forma `POINT(...)`.
- `GiST`: índice espacial para otimizar consultas.

## Segurança

O `RLS` está habilitado para evitar acesso direto com a chave `anon` do Supabase, sem políticas públicas de escrita. O backend utiliza uma conexão PostgreSQL própria protegida por variáveis de ambiente; **não coloque DB_PASSWORD no Git**. A autenticação de escrita é controlada no backend.

## Demonstração para o professor

Abra a tabela e comprove que `localizacao` é `geometry`, depois execute `consultas.sql` mostrando a busca num raio de 2 km e a busca em um retângulo. Explique por que o mapa pede apenas os pontos da região visível.
