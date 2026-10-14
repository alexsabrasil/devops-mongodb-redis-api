# Desafio 2 — API REST com MongoDB e Redis

Projeto desenvolvido como atividade prática de DevOps, utilizando Node.js, Express, MongoDB, Redis e Docker Compose.

## Objetivo

Implementar uma API REST para cadastro e consulta de usuários, utilizando MongoDB para persistência e Redis para armazenamento temporário em cache.

O projeto também incorpora práticas de segurança, testes automatizados e separação de ambientes.

## Tecnologias

- Node.js 22
- Express 5
- MongoDB 7
- Redis 7
- Mongoose 9
- bcryptjs
- Docker e Docker Compose
- Node.js Test Runner (`node:test`)

## Arquitetura

A aplicação utiliza os seguintes componentes:

- **Express:** recebe e processa requisições HTTP.
- **MongoDB:** armazena os dados dos usuários.
- **Redis:** mantém temporariamente os dados consultados.
- **bcryptjs:** gera hashes das senhas antes do armazenamento.

A estratégia de cache utilizada é **Cache-Aside**:

1. A API consulta o Redis.
2. Se a chave existir, retorna os dados do cache (*cache hit*).
3. Caso contrário, consulta o MongoDB (*cache miss*).
4. O resultado é armazenado novamente no Redis, com TTL de 3.600 segundos.

O cadastro também popula o cache após a criação do usuário.

## Como executar

### Pré-requisitos

- Node.js 22 ou superior
- npm
- Docker com Docker Compose

### Instalação

```bash
npm ci
```

Crie o arquivo `.env` a partir do modelo:

```bash
cp .env.example .env
```

Inicie MongoDB e Redis:

```bash
docker compose up -d
```

Inicie a API:

```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

## Endpoints

### POST /users

Cadastra um usuário.

Exemplo de requisição:

```json
{
  "name": "Usuario Teste",
  "email": "teste@example.com",
  "password": "SenhaFicticia2026!"
}
```

Respostas previstas:

- `201 Created` — usuário cadastrado.
- `400 Bad Request` — dados inválidos.
- `409 Conflict` — usuário já existente.
- `500 Internal Server Error` — erro interno.

### GET /users/:id

Consulta um usuário pelo identificador do MongoDB.

Respostas previstas:

- `200 OK` — usuário encontrado.
- `400 Bad Request` — identificador inválido.
- `404 Not Found` — usuário inexistente.
- `500 Internal Server Error` — erro interno.

A resposta informa a origem dos dados por meio do campo `source`, que pode ser `redis` ou `mongodb`.

## Segurança

As seguintes medidas foram implementadas:

- Armazenamento de senhas utilizando hash bcrypt.
- Remoção do campo `password` das respostas da API.
- Exclusão do campo `password` dos objetos armazenados no cache.
- Validação básica dos dados de cadastro.
- Validação dos identificadores MongoDB.
- Expiração automática do cache Redis.
- Remoção do cabeçalho `X-Powered-By`.
- Proteção dos arquivos `.env` por meio do `.gitignore`.
- Exposição local das portas MongoDB e Redis.

Este projeto é um laboratório acadêmico. Para utilização em produção, seriam necessários controles adicionais, como autenticação, autorização, HTTPS, limitação de requisições e gerenciamento seguro de segredos.

## Testes automatizados

Execute:

```bash
npm test
```

A suíte contém quatro testes:

1. Rejeição de cadastro sem dados obrigatórios.
2. Rejeição de identificador inválido.
3. Retorno HTTP 404 para rota inexistente.
4. Teste de integração envolvendo MongoDB, bcrypt e Redis.

O teste de integração verifica cadastro, proteção da senha, cache hit, cache miss, TTL e recriação do cache.

**Última execução local validada:** 4 testes aprovados, 0 falhas.

Os testes de integração utilizam o banco `desafio-2-test`, configurado em `.env.test`, e exigem MongoDB e Redis em execução.

## Organização do projeto

```text
desafio-2/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── routes.js
│   ├── config/
│   │   └── redis.js
│   ├── controllers/
│   │   └── UserController.js
│   └── models/
│       └── User.js
└── tests/
    ├── api.test.js
    └── integration.test.js
```

## Próximas melhorias

- Pipeline CI/CD com GitHub Actions.
- Tratamento centralizado de erros.
- Testes adicionais de validação e indisponibilidade de serviços.
- Autenticação e autorização.
- Observabilidade e métricas.

## Contexto

Atividade prática de DevOps, com foco em integração de serviços, persistência, cache, segurança e qualidade de software.
