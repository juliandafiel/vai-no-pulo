# Plano de Testes - Autenticacao e Login

## Objetivo
Validar todos os fluxos de autenticacao: login, registro, recuperacao de senha, sessao e logout.

---

## LOGIN

### TC-AUTH-001: Login com Credenciais Validas
**Prioridade:** P0
**Pre-condicoes:** Usuario cadastrado com email verificado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir app | Tela de login exibida |
| 2 | Inserir email valido | Email aceito |
| 3 | Inserir senha valida | Senha aceita (mascara ****) |
| 4 | Tocar em "Entrar" | Loading exibido |
| 5 | Aguardar resposta | Redirect para Dashboard |
| 6 | Verificar sessao | Usuario logado, dados carregados |

---

### TC-AUTH-002: Login com Email Incorreto
**Prioridade:** P0
**Pre-condicoes:** Email nao cadastrado no sistema

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Inserir email nao cadastrado | Email aceito no campo |
| 2 | Inserir qualquer senha | Senha aceita |
| 3 | Tocar em "Entrar" | Loading exibido |
| 4 | Aguardar resposta | Erro: "Email ou senha incorretos" |
| 5 | Verificar campo | Email destacado em vermelho |

**Seguranca:** NAO deve informar se email existe ou nao (evitar enumeracao)

---

### TC-AUTH-003: Login com Senha Incorreta
**Prioridade:** P0
**Pre-condicoes:** Email cadastrado, senha incorreta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Inserir email valido | Email aceito |
| 2 | Inserir senha incorreta | Senha aceita |
| 3 | Tocar em "Entrar" | Erro: "Email ou senha incorretos" |
| 4 | Repetir 5x | Conta pode ser bloqueada temporariamente |
| 5 | Verificar bloqueio | "Muitas tentativas, tente em 15 minutos" |

---

### TC-AUTH-004: Login com Campos Vazios
**Prioridade:** P0
**Pre-condicoes:** Tela de login aberta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Deixar email vazio | - |
| 2 | Deixar senha vazia | - |
| 3 | Tocar em "Entrar" | Botao desabilitado OU erro de validacao |
| 4 | Preencher apenas email | Erro: "Senha obrigatoria" |
| 5 | Preencher apenas senha | Erro: "Email obrigatorio" |

---

### TC-AUTH-005: Validacao de Formato de Email
**Prioridade:** P1
**Pre-condicoes:** Tela de login

| Email | Resultado Esperado |
|-------|-------------------|
| usuario@email.com | Valido |
| usuario@email | Invalido |
| usuario.email.com | Invalido |
| @email.com | Invalido |
| usuario@ | Invalido |
| usuario+tag@email.com | Valido |
| usuario@sub.domain.com | Valido |

---

### TC-AUTH-006: Mostrar/Ocultar Senha
**Prioridade:** P1
**Pre-condicoes:** Campo de senha com texto

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Digitar senha | Exibido como "********" |
| 2 | Tocar no icone de olho | Senha visivel |
| 3 | Tocar novamente | Senha oculta |

---

### TC-AUTH-007: Login com Teclado
**Prioridade:** P1
**Pre-condicoes:** Campos preenchidos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Digitar email | Teclado tipo email (com @) |
| 2 | Pressionar "Next" no teclado | Foco vai para senha |
| 3 | Digitar senha | Teclado padrao |
| 4 | Pressionar "Done/Go" | Submete formulario |

---

## REGISTRO DE USUARIO

### TC-AUTH-008: Registro de Novo Cliente
**Prioridade:** P0
**Pre-condicoes:** Email nao cadastrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Criar conta" | Tela de registro abre |
| 2 | Preencher nome completo | Campo aceita |
| 3 | Preencher email | Validacao de formato |
| 4 | Preencher telefone | Mascara aplicada |
| 5 | Preencher senha | Validacao de forca |
| 6 | Confirmar senha | Deve ser igual |
| 7 | Aceitar termos | Checkbox marcado |
| 8 | Tocar em "Registrar" | Conta criada |
| 9 | Verificar email | Email de verificacao enviado |

---

### TC-AUTH-009: Registro de Motorista
**Prioridade:** P0
**Pre-condicoes:** Selecionar tipo "Motorista"

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar "Sou motorista" | Formulario estendido |
| 2 | Preencher dados pessoais | Nome, email, telefone |
| 3 | Preencher CPF | Validacao de CPF |
| 4 | Preencher CNH | Numero e validade |
| 5 | Foto da CNH (frente) | Upload obrigatorio |
| 6 | Foto da CNH (verso) | Upload obrigatorio |
| 7 | Registrar | Conta criada como "PENDING" |
| 8 | Verificar status | "Aguardando aprovacao" |

---

### TC-AUTH-010: Validacao de Senha Forte
**Prioridade:** P1
**Pre-condicoes:** Tela de registro

| Senha | Resultado |
|-------|-----------|
| 123456 | Muito fraca - rejeitada |
| senha123 | Fraca - aviso |
| Senha123 | Media - aceita com aviso |
| Senha@123 | Forte - aceita |
| S3nh@Muit0F0rt3! | Muito forte - aceita |

**Requisitos minimos:**
- [ ] Minimo 8 caracteres
- [ ] Pelo menos 1 letra maiuscula
- [ ] Pelo menos 1 numero
- [ ] Pelo menos 1 caractere especial (recomendado)

---

### TC-AUTH-011: Registro com Email Duplicado
**Prioridade:** P0
**Pre-condicoes:** Email ja cadastrado no sistema

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Preencher formulario com email existente | Dados aceitos |
| 2 | Tocar em "Registrar" | Erro: "Email ja cadastrado" |
| 3 | Opcao disponivel | Link para recuperar senha |

---

### TC-AUTH-012: Validacao de CPF
**Prioridade:** P0
**Pre-condicoes:** Campo de CPF no registro de motorista

| CPF | Resultado |
|-----|-----------|
| 123.456.789-09 | Valido (se digito verificador correto) |
| 111.111.111-11 | Invalido (todos iguais) |
| 123.456.789-00 | Invalido (digito errado) |
| 12345678909 | Valido (sem mascara) |
| 123456789 | Invalido (incompleto) |

---

### TC-AUTH-013: Validacao de Telefone
**Prioridade:** P1
**Pre-condicoes:** Campo de telefone

| Telefone | Resultado |
|----------|-----------|
| (11) 99999-9999 | Valido (celular SP) |
| (11) 3333-3333 | Valido (fixo SP) |
| 11999999999 | Valido (sem mascara) |
| 999999999 | Invalido (sem DDD) |
| (99) 99999-9999 | Valido (outros estados) |

---

## RECUPERACAO DE SENHA

### TC-AUTH-014: Solicitar Recuperacao de Senha
**Prioridade:** P0
**Pre-condicoes:** Email cadastrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Esqueci minha senha" | Tela de recuperacao |
| 2 | Inserir email cadastrado | Email aceito |
| 3 | Tocar em "Enviar" | Mensagem de sucesso |
| 4 | Verificar email | Link de recuperacao recebido |
| 5 | Clicar no link | Tela de nova senha abre |

**Seguranca:** Mesmo se email nao existir, mostrar mesma mensagem (evitar enumeracao)

---

### TC-AUTH-015: Redefinir Senha via Link
**Prioridade:** P0
**Pre-condicoes:** Link de recuperacao recebido

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Clicar no link do email | App abre na tela de redefinicao |
| 2 | Inserir nova senha | Validacao de forca |
| 3 | Confirmar nova senha | Senhas devem coincidir |
| 4 | Tocar em "Redefinir" | Senha alterada |
| 5 | Fazer login | Login com nova senha funciona |
| 6 | Login com senha antiga | Deve falhar |

---

### TC-AUTH-016: Link de Recuperacao Expirado
**Prioridade:** P1
**Pre-condicoes:** Link gerado ha mais de 24 horas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Clicar em link antigo | Mensagem: "Link expirado" |
| 2 | Opcao disponivel | Solicitar novo link |

---

### TC-AUTH-017: Link de Recuperacao Ja Usado
**Prioridade:** P1
**Pre-condicoes:** Link ja utilizado uma vez

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Clicar no link novamente | Erro: "Link ja utilizado" |
| 2 | Tentativa de uso | Bloqueado |

---

## SESSAO E TOKEN

### TC-AUTH-018: Persistencia de Sessao
**Prioridade:** P0
**Pre-condicoes:** Usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fazer login | Logado com sucesso |
| 2 | Fechar app completamente | App fechado |
| 3 | Reabrir app | Usuario ainda logado |
| 4 | Verificar dados | Carregados corretamente |

---

### TC-AUTH-019: Expiracao de Token
**Prioridade:** P0
**Pre-condicoes:** Token configurado para expirar em 1 hora (para teste)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fazer login | Token gerado |
| 2 | Aguardar expiracao | 1 hora |
| 3 | Tentar acao | Redirect para login |
| 4 | Mensagem | "Sessao expirada, faca login novamente" |

---

### TC-AUTH-020: Refresh Token
**Prioridade:** P1
**Pre-condicoes:** Access token proximo de expirar

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Usar app normalmente | Token ativo |
| 2 | Access token expira | Refresh automatico |
| 3 | Verificar | Novo token obtido sem re-login |
| 4 | Continuar usando | Sem interrupcao |

---

### TC-AUTH-021: Login em Multiplos Dispositivos
**Prioridade:** P1
**Pre-condicoes:** Mesma conta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Login no dispositivo A | Logado |
| 2 | Login no dispositivo B | Logado |
| 3 | Verificar dispositivo A | Permanece logado OU deslogado (politica) |
| 4 | Notificacao | "Novo login detectado" (se aplicavel) |

---

## LOGOUT

### TC-AUTH-022: Logout Normal
**Prioridade:** P0
**Pre-condicoes:** Usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir menu/perfil | Menu exibido |
| 2 | Tocar em "Sair" | Confirmacao: "Deseja realmente sair?" |
| 3 | Confirmar | Logout realizado |
| 4 | Verificar | Tela de login exibida |
| 5 | Tentar voltar | Nao deve acessar area logada |

---

### TC-AUTH-023: Logout Limpa Dados Sensiveis
**Prioridade:** P0
**Pre-condicoes:** Usuario com dados carregados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fazer logout | Deslogado |
| 2 | Verificar storage | Token removido |
| 3 | Verificar cache | Dados sensiveis limpos |
| 4 | Login com outra conta | Nao ve dados da conta anterior |

---

## VERIFICACAO DE EMAIL

### TC-AUTH-024: Email de Verificacao
**Prioridade:** P1
**Pre-condicoes:** Registro concluido, email nao verificado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar inbox | Email de verificacao recebido |
| 2 | Clicar no link | App abre, email verificado |
| 3 | Status atualizado | "Email verificado" |
| 4 | Funcionalidades liberadas | Acesso completo |

---

### TC-AUTH-025: Reenviar Email de Verificacao
**Prioridade:** P1
**Pre-condicoes:** Email nao verificado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Reenviar email" | Novo email enviado |
| 2 | Limite | Maximo 3 por hora |
| 3 | Exceder limite | "Aguarde antes de solicitar novamente" |

---

## BIOMETRIA

### TC-AUTH-026: Configurar Login Biometrico
**Prioridade:** P2
**Pre-condicoes:** Dispositivo com biometria, usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir configuracoes | Tela de config |
| 2 | Ativar "Login com biometria" | Solicita biometria para confirmar |
| 3 | Confirmar com digital/face | Configuracao salva |
| 4 | Fazer logout | Deslogado |
| 5 | Tentar login | Opcao de biometria disponivel |

---

### TC-AUTH-027: Login com Biometria
**Prioridade:** P2
**Pre-condicoes:** Biometria configurada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir app | Tela de login com opcao biometria |
| 2 | Tocar em icone de biometria | Solicita digital/face |
| 3 | Autenticar | Login realizado |
| 4 | Falhar biometria 3x | Fallback para senha |

---

## CHECKLIST DE REGRESSAO - AUTENTICACAO

### Login
- [ ] Login com credenciais validas
- [ ] Login com email incorreto
- [ ] Login com senha incorreta
- [ ] Login com campos vazios
- [ ] Validacao de formato de email
- [ ] Mostrar/ocultar senha
- [ ] Bloqueio por tentativas

### Registro
- [ ] Registro de cliente
- [ ] Registro de motorista
- [ ] Validacao de senha forte
- [ ] Email duplicado
- [ ] Validacao de CPF
- [ ] Validacao de telefone
- [ ] Aceite de termos

### Recuperacao
- [ ] Solicitar recuperacao
- [ ] Redefinir senha
- [ ] Link expirado
- [ ] Link ja usado

### Sessao
- [ ] Persistencia de sessao
- [ ] Expiracao de token
- [ ] Refresh token
- [ ] Multiplos dispositivos

### Logout
- [ ] Logout normal
- [ ] Limpeza de dados
- [ ] Biometria (se disponivel)

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| AUTH-001 | Token nao atualiza apos troca de senha | Aberto | 1.2.0 |
| AUTH-002 | Biometria nao funciona em iOS 16.4 | Investigando | 1.2.0 |
| AUTH-003 | Email de verificacao vai para spam | Aberto | 1.2.0 |

---

## NOTAS DE SEGURANCA

1. **Rate Limiting:** Limitar tentativas de login (5/minuto)
2. **Brute Force:** Bloquear conta apos 10 tentativas
3. **Enumeracao:** Nao revelar se email existe
4. **HTTPS:** Todas as requisicoes devem ser HTTPS
5. **Tokens:** Usar tokens JWT com expiracao curta
6. **Senha:** Nunca logar ou armazenar senhas em texto plano
