# Configuração do Envio de Emails via Gmail

## ✅ O que já foi configurado

1. **Serviço de Email** (`src/mail/mail.service.ts`)
   - Integração com Gmail via Nodemailer
   - 3 tipos de emails prontos com templates HTML:
     - Código de verificação (6 dígitos, expira em 10 minutos)
     - Email de boas-vindas (diferente para clientes e motoristas)
     - Recuperação de senha

2. **Endpoints de Autenticação** (`src/auth/auth.controller.ts`)
   - `POST /auth/send-verification` - Envia código de verificação
   - `POST /auth/verify-code` - Valida código de verificação
   - `POST /auth/register/customer` - Registra cliente
   - `POST /auth/register/driver` - Registra motorista

3. **Frontend Integrado**
   - Tela de cadastro de cliente com verificação por email
   - Tela de cadastro de motorista
   - Tratamento de erros apropriado
   - Botão de reenvio de código

## 🔧 O que você precisa fazer

### Passo 1: Configurar suas credenciais do Gmail

Edite o arquivo `.env` no diretório `backend/` e substitua os valores de exemplo:

```env
GMAIL_USER="seu-email@gmail.com"
GMAIL_APP_PASSWORD="sua-senha-de-app-aqui"
```

### Passo 2: Gerar senha de aplicativo do Gmail

**IMPORTANTE:** Não use sua senha normal do Gmail! Você precisa gerar uma senha de aplicativo.

1. Acesse: https://myaccount.google.com/apppasswords
2. Faça login com sua conta Gmail
3. Selecione "Mail" como aplicativo
4. Selecione "Other (Custom name)" como dispositivo
5. Digite um nome, por exemplo: "Vai no Pulo Backend"
6. Clique em "Generate"
7. Copie a senha gerada (16 caracteres sem espaços)
8. Cole no arquivo `.env` no campo `GMAIL_APP_PASSWORD`

**Observação:** Se você não vê a opção "App passwords", pode ser porque:
- Você precisa ativar a verificação em duas etapas primeiro
- Sua conta é gerenciada por uma organização
- Você está usando uma conta do Google Workspace

### Passo 3: Reiniciar o backend

Após configurar o `.env`, reinicie o servidor backend:

```bash
cd backend
npm run start:dev
```

### Passo 4: Testar o envio de emails

Você pode testar o envio de emails:

1. Abra o app mobile
2. Vá para "Criar uma conta" > "Quero enviar mercadorias"
3. Preencha os dados pessoais
4. Clique em "Continuar"
5. Verifique seu email para o código de verificação

## 📧 Tipos de Email Enviados

### 1. Código de Verificação
- **Quando:** Ao clicar em "Continuar" no cadastro de cliente
- **Expira em:** 10 minutos
- **Formato:** 6 dígitos numéricos

### 2. Email de Boas-vindas (Cliente)
- **Quando:** Após completar o cadastro de cliente
- **Conteúdo:** Confirmação de cadastro e próximos passos

### 3. Email de Boas-vindas (Motorista)
- **Quando:** Após completar o cadastro de motorista
- **Conteúdo:** Confirmação de recebimento e informação sobre análise (48h)

### 4. Recuperação de Senha
- **Quando:** Ao usar "Esqueci minha senha"
- **Expira em:** 1 hora
- **Formato:** Link com token JWT

## ⚠️ Importante

- **Segurança:** Nunca compartilhe sua senha de aplicativo
- **Produção:** Em produção, considere usar um serviço de email dedicado como SendGrid, AWS SES, ou Mailgun
- **Limite de envio:** Gmail tem limite de 500 emails por dia para contas gratuitas
- **Redis:** Atualmente os códigos de verificação são armazenados em memória (Map). Em produção, migre para Redis

## 🐛 Solução de Problemas

### Erro: "Invalid login"
- Verifique se você está usando uma senha de aplicativo, não sua senha normal
- Certifique-se de que a verificação em duas etapas está ativada

### Erro: "Connection timeout"
- Verifique sua conexão com a internet
- Alguns provedores bloqueiam a porta 587 - tente usar uma rede diferente

### Email não chega
- Verifique a pasta de spam
- Confirme se o email está correto no cadastro
- Verifique os logs do backend para erros

### Código expirado
- Códigos expiram em 10 minutos
- Use o botão "Reenviar código" para gerar um novo

## 📝 Logs

O serviço de email registra todas as ações:

- ✅ `Email enviado para {email}: {messageId}` - Sucesso
- ❌ `Erro ao enviar email para {email}:` - Falha

Verifique o console do backend para depuração.
