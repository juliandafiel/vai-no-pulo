# Transport System

Sistema completo de transporte A->B (Backend, Mobile, Admin).

## Estrutura

- `/backend`: NestJS + Prisma + Postgres + Redis
- `/mobile`: React Native (Expo)
- `/admin`: React (Vite) + Tailwind

## Pré-requisitos

- Docker e Docker Compose
- Node.js (v18+)
- NPM ou Yarn

## Como rodar

1. **Infraestrutura (Banco de dados, Redis, MinIO)**
   ```bash
   docker-compose up -d
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   # Configurar .env (já gerado com defaults)
   npx prisma migrate dev --name init
   npm run start:dev
   ```
   Swagger disponível em: http://localhost:3000/api

3. **Admin Web**
   ```bash
   cd admin
   npm install
   npm run dev
   ```
   Acesse: http://localhost:5173

4. **Mobile App**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
   Use o app Expo Go no celular ou emulador Android/iOS.

## Funcionalidades Implementadas (MVP)

- **Auth**: Login/Registro JWT.
- **Veículos**: Cadastro e Aprovação (Admin).
- **Trajetos**: Criação de rotas.
- **Mercadorias**: Cadastro com verificação de política (blacklist).
- **Realtime**: WebSocket Gateway configurado para localização e chat.

## Notas

- O backend roda na porta 3000.
- O Postgres roda na porta 5434 (para evitar conflitos com 5432 padrão).
- Usuários criados via API `/auth/register`.
- Para testar Admin, crie um usuário e altere a role manualmente no banco para 'ADMIN' ou implemente seed.

## Testes

- Backend: `npm test`
