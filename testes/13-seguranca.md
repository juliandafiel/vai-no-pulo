# Plano de Testes - Seguranca

## Objetivo
Validar aspectos de seguranca do aplicativo: autenticacao, autorizacao, protecao de dados e vulnerabilidades.

---

## AUTENTICACAO

### TC-SEC-001: Protecao Contra Brute Force
**Prioridade:** P0
**Pre-condicoes:** Conta existente

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar login com senha errada | Erro |
| 2 | Repetir 5x | Conta ainda disponivel |
| 3 | Repetir mais 5x | Bloqueio temporario |
| 4 | Mensagem | "Muitas tentativas, aguarde 15 min" |
| 5 | Aguardar bloqueio | 15 minutos |
| 6 | Tentar novamente | Desbloqueado |

---

### TC-SEC-002: Senha Armazenada com Hash
**Prioridade:** P0
**Pre-condicoes:** Acesso ao banco de dados (teste)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar tabela de usuarios | Coluna password |
| 2 | Verificar valor | Hash bcrypt (nao texto plano) |
| 3 | Mesmo senha, usuarios diferentes | Hashes diferentes (salt) |

---

### TC-SEC-003: Token JWT Valido
**Prioridade:** P0
**Pre-condicoes:** Usuario logado

| Verificacao | Resultado Esperado |
|-------------|-------------------|
| Token assinado | Assinatura valida |
| Expiracao | Definida (ex: 1h) |
| Payload | Nao contem dados sensiveis |
| Algoritmo | RS256 ou HS256 (nao none) |

---

### TC-SEC-004: Refresh Token Seguro
**Prioridade:** P0
**Pre-condicoes:** Usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar refresh token | Armazenado com seguranca |
| 2 | Expiracao | Maior que access token |
| 3 | Rotacao | Novo token a cada uso |
| 4 | Revogacao | Token antigo invalido |

---

### TC-SEC-005: Logout Invalida Token
**Prioridade:** P0
**Pre-condicoes:** Usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Copiar token atual | Token salvo |
| 2 | Fazer logout | Deslogado |
| 3 | Usar token copiado | Rejeitado (401) |

---

## AUTORIZACAO

### TC-SEC-006: Acesso a Recursos de Outro Usuario
**Prioridade:** P0
**Pre-condicoes:** Dois usuarios diferentes

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Usuario A obtem ID de pedido de B | ID obtido |
| 2 | Usuario A tenta acessar pedido de B | Negado (403) |
| 3 | Usuario A tenta editar pedido de B | Negado (403) |
| 4 | Usuario A tenta cancelar pedido de B | Negado (403) |

---

### TC-SEC-007: Motorista Nao Aprovado
**Prioridade:** P0
**Pre-condicoes:** Motorista com status "PENDING"

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar ficar online | Bloqueado |
| 2 | Tentar aceitar pedido | Bloqueado |
| 3 | Tentar acessar ganhos | Bloqueado |

---

### TC-SEC-008: Cliente Tenta Acoes de Motorista
**Prioridade:** P0
**Pre-condicoes:** Usuario tipo CUSTOMER

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar acessar /driver/* | Negado (403) |
| 2 | Tentar aceitar pedido via API | Negado (403) |
| 3 | Tentar confirmar entrega | Negado (403) |

---

### TC-SEC-009: Roles e Permissoes Admin
**Prioridade:** P0
**Pre-condicoes:** Diferentes niveis de admin

| Role | Permissao | Resultado |
|------|-----------|-----------|
| VIEWER | Ver usuarios | OK |
| VIEWER | Editar usuarios | Negado |
| EDITOR | Editar usuarios | OK |
| EDITOR | Excluir usuarios | Negado |
| ADMIN | Excluir usuarios | OK |

---

## PROTECAO DE DADOS

### TC-SEC-010: Dados em Transito (HTTPS)
**Prioridade:** P0
**Pre-condicoes:** App em uso

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Interceptar trafego | Proxy configurado |
| 2 | Verificar protocolo | HTTPS (nao HTTP) |
| 3 | Verificar certificado | Valido, nao expirado |
| 4 | Certificate pinning | Implementado (opcional) |

---

### TC-SEC-011: Dados em Repouso (Storage)
**Prioridade:** P0
**Pre-condicoes:** App com dados salvos

| Dado | Armazenamento | Criptografado |
|------|---------------|---------------|
| Token | Keychain/Keystore | Sim |
| Senha | NUNCA armazenar | N/A |
| Dados pessoais | Secure Storage | Sim |
| Cache de imagens | Cache padrao | Nao (OK) |
| Logs | Nao deve conter PII | N/A |

---

### TC-SEC-012: Dados em Logs
**Prioridade:** P0
**Pre-condicoes:** Logs do app

| Dado | Deve aparecer em log? |
|------|----------------------|
| Senha | NAO |
| Token | NAO |
| CPF | NAO (ou mascarado) |
| Email | NAO (ou mascarado) |
| Telefone | NAO (ou mascarado) |
| Erros tecnicos | SIM |

---

### TC-SEC-013: Mascaramento de Dados Sensiveis
**Prioridade:** P1
**Pre-condicoes:** Telas com dados sensiveis

| Dado | Exibicao |
|------|----------|
| CPF | 123.***.***-09 |
| Telefone | (11) 9****-1234 |
| Email | j***@email.com |
| Placa | ABC-*234 (se necessario) |
| Cartao | **** **** **** 1234 |

---

## VULNERABILIDADES WEB/API

### TC-SEC-014: SQL Injection
**Prioridade:** P0
**Pre-condicoes:** Campos de entrada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Inserir ' OR '1'='1 | Tratado como texto |
| 2 | Inserir '; DROP TABLE-- | Tratado como texto |
| 3 | Verificar | Nenhuma query maliciosa executada |

---

### TC-SEC-015: XSS (Cross-Site Scripting)
**Prioridade:** P0
**Pre-condicoes:** Campos que exibem texto do usuario

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Inserir <script>alert('XSS')</script> | Sanitizado |
| 2 | Verificar exibicao | Texto escapado |
| 3 | Inserir em nome | Nao executa script |
| 4 | Inserir em mensagem de chat | Nao executa script |

---

### TC-SEC-016: CSRF (Cross-Site Request Forgery)
**Prioridade:** P1
**Pre-condicoes:** API endpoints criticos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar request sem token | Rejeitado |
| 2 | Tentar com token de outra origem | Rejeitado |
| 3 | CSRF token em operacoes sensiveis | Implementado |

---

### TC-SEC-017: IDOR (Insecure Direct Object Reference)
**Prioridade:** P0
**Pre-condicoes:** IDs de recursos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Obter ID de recurso proprio | ID obtido |
| 2 | Incrementar ID | /order/124 -> /order/125 |
| 3 | Tentar acessar | Negado se nao e dono |

---

### TC-SEC-018: Rate Limiting
**Prioridade:** P0
**Pre-condicoes:** API exposta

| Endpoint | Limite | Janela |
|----------|--------|--------|
| /login | 10 | 1 minuto |
| /forgot-password | 5 | 1 hora |
| /api/* | 100 | 1 minuto |
| /upload | 10 | 1 minuto |

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fazer 100 requests em 1 min | Passa |
| 2 | Fazer 101o request | 429 Too Many Requests |
| 3 | Aguardar janela | Requests liberados |

---

## SEGURANCA MOBILE

### TC-SEC-019: Rooted/Jailbreak Detection
**Prioridade:** P2
**Pre-condicoes:** Dispositivo com root/jailbreak

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir app em device rooted | Aviso exibido |
| 2 | Funcionalidades sensiveis | Podem ser bloqueadas |
| 3 | Ou | Apenas aviso (politica) |

---

### TC-SEC-020: Screenshot/Screen Recording
**Prioridade:** P2
**Pre-condicoes:** Telas sensiveis

| Tela | Screenshot permitido? |
|------|----------------------|
| Login | Sim |
| Dados do cartao | Nao |
| Documentos | Depende da politica |
| Chat | Sim |

---

### TC-SEC-021: Clipboard Protection
**Prioridade:** P2
**Pre-condicoes:** Dados sensiveis copiados

| Dado | Comportamento |
|------|---------------|
| Senha | Nao permite copiar |
| Token | Nao permite copiar |
| Endereco | Permite copiar |
| Nome | Permite copiar |

---

### TC-SEC-022: Backup de Dados (Android)
**Prioridade:** P1
**Pre-condicoes:** Android com backup ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar allowBackup | false no manifest |
| 2 | Ou | Excluir arquivos sensiveis |
| 3 | Backup do dispositivo | Dados sensiveis nao incluidos |

---

## SESSAO

### TC-SEC-023: Timeout de Sessao
**Prioridade:** P1
**Pre-condicoes:** Usuario logado

| Cenario | Timeout |
|---------|---------|
| Inatividade no app | 30 minutos |
| App em background | 4 horas |
| Token expiracao | 1 hora (refresh disponivel) |

---

### TC-SEC-024: Sessao Simultanea
**Prioridade:** P1
**Pre-condicoes:** Mesmo usuario, dois dispositivos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Login no dispositivo A | Logado |
| 2 | Login no dispositivo B | Logado |
| 3 | Verificar A | Pode deslogar (politica) |
| 4 | Ou | Ambos ativos (politica) |

---

### TC-SEC-025: Logout Remoto
**Prioridade:** P2
**Pre-condicoes:** Multiplas sessoes

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ver sessoes ativas | Lista exibida |
| 2 | Encerrar sessao remota | Opcao disponivel |
| 3 | Confirmar | Sessao encerrada |
| 4 | Dispositivo remoto | Deslogado |

---

## PRIVACIDADE

### TC-SEC-026: Consentimento de Localizacao
**Prioridade:** P0
**Pre-condicoes:** Usuario motorista

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Solicitar localizacao | Explicacao clara |
| 2 | Proposito | Apenas para entregas |
| 3 | Quando | Apenas quando necessario |
| 4 | Revogar | Opcao disponivel |

---

### TC-SEC-027: Exclusao de Dados (LGPD)
**Prioridade:** P0
**Pre-condicoes:** Usuario deseja excluir conta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Solicitar exclusao | Processo iniciado |
| 2 | Confirmar identidade | Verificacao |
| 3 | Prazo | 30 dias (ou menos) |
| 4 | Dados removidos | Conforme LGPD |
| 5 | Dados retidos | Apenas obrigatorios por lei |

---

### TC-SEC-028: Exportacao de Dados (LGPD)
**Prioridade:** P1
**Pre-condicoes:** Usuario solicita dados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Solicitar exportacao | Processo iniciado |
| 2 | Formato | JSON ou CSV |
| 3 | Conteudo | Todos os dados pessoais |
| 4 | Entrega | Link seguro por email |

---

## CHECKLIST DE SEGURANCA

### Autenticacao
- [ ] Brute force protection
- [ ] Senha com hash (bcrypt)
- [ ] Token JWT valido
- [ ] Refresh token seguro
- [ ] Logout invalida token

### Autorizacao
- [ ] Acesso negado a recursos de outros
- [ ] Roles e permissoes funcionando
- [ ] Motorista pendente bloqueado
- [ ] Cliente nao acessa funcoes de motorista

### Dados
- [ ] HTTPS em todas as requisicoes
- [ ] Token em Keychain/Keystore
- [ ] Sem PII em logs
- [ ] Dados mascarados na UI

### Vulnerabilidades
- [ ] SQL Injection protegido
- [ ] XSS sanitizado
- [ ] CSRF token
- [ ] IDOR verificado
- [ ] Rate limiting ativo

### Mobile
- [ ] Root/Jailbreak detection
- [ ] allowBackup=false (Android)
- [ ] Clipboard protection

### Privacidade
- [ ] Consentimento de localizacao
- [ ] Exclusao de dados
- [ ] Exportacao de dados

---

## FERRAMENTAS DE TESTE

- **OWASP ZAP:** Scan de vulnerabilidades
- **Burp Suite:** Interceptacao e teste de API
- **MobSF:** Analise de seguranca mobile
- **Frida:** Runtime manipulation
- **Drozer:** Android security testing

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Severidade |
|----|-----------|--------|------------|
| SEC-001 | Token visivel em log de debug | Corrigido | Alta |
| SEC-002 | allowBackup=true no Android | Aberto | Media |
| SEC-003 | Rate limit nao aplicado em /login | Corrigido | Alta |

---

## NOTAS DO QA

1. **Teste em ambiente isolado:** Nunca em producao
2. **Ferramentas adequadas:** Use proxies e interceptadores
3. **Documentar findings:** Severidade e reproducao
4. **Coordenar com dev:** Fixes devem ser priorizados
5. **Re-testar:** Apos correcoes, validar novamente
6. **Compliance:** Verificar requisitos LGPD
