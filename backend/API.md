# API — MapaSEBS

API REST desenvolvida com Node.js e Express.

O banco de dados utilizado é PostgreSQL com PostGIS,
hospedado no Supabase.

## Executar localmente

Na raiz do projeto:

npm --prefix backend run dev

Servidor: http://localhost:3000

## Rotas

| Método | Rota | Descrição |
|---|---|---|
| GET | /api/health | Verificar servidor |
| GET | /api/health/db | Verificar PostgreSQL e PostGIS |
| POST | /api/pontos | Cadastrar ponto |
| GET | /api/pontos/:id | Consultar ponto pelo ID |
| PUT | /api/pontos/:id | Atualizar ponto |
| DELETE | /api/pontos/:id | Excluir ponto |
| GET | /api/pontos/proximos | Buscar por distância |
| GET | /api/pontos | Buscar pela área visível |

## Exemplo de cadastro

POST /api/pontos

Corpo JSON:

{
  "nome": "Ecoponto Central",
  "descricao": "Recebe materiais recicláveis",
  "tipo_material": "Papel e plástico",
  "endereco": "Centro",
  "latitude": -6.76,
  "longitude": -38.23
}

O cadastro retorna HTTP 201 quando realizado.

## Consultar ponto

GET /api/pontos/1

Retorna os dados do ponto com ID 1.

Se não existir, retorna HTTP 404.

## Atualizar ponto

PUT /api/pontos/1

Envia um JSON com todos os campos do cadastro,
incluindo latitude e longitude.

## Excluir ponto

DELETE /api/pontos/1

Remove o registro correspondente ao ID informado.

## Buscar pontos próximos

GET /api/pontos/proximos

Parâmetros:

- latitude: latitude do usuário
- longitude: longitude do usuário
- raio: distância em metros (padrão 2000)

Exemplo:

/api/pontos/proximos?latitude=-6.76&longitude=-38.23&raio=2000

A consulta utiliza ST_DWithin e retorna a distância
de cada ponto encontrado.

## Buscar pela área visível

GET /api/pontos

Parâmetros obrigatórios:

- sul: latitude mínima
- norte: latitude máxima
- oeste: longitude mínima
- leste: longitude máxima

Exemplo:

/api/pontos?sul=-6.77&norte=-6.75&oeste=-38.24&leste=-38.22

A consulta utiliza ST_MakeEnvelope e ST_Intersects.

O frontend deverá enviar novos limites quando
o usuário movimentar o mapa.

## Armazenamento espacial

A localização utiliza:

extensions.geometry(Point, 4326)

As coordenadas são armazenadas como objeto espacial
do PostGIS, utilizando o SRID 4326.

## Testes

Na raiz do projeto:

npm --prefix backend test

## Observações

- As rotas recebem e retornam JSON.
- As coordenadas utilizam graus decimais.
- O banco está hospedado no Supabase.
- As credenciais ficam no arquivo .env.
- As rotas de escrita ainda precisam de autenticação
  antes da publicação pública.
