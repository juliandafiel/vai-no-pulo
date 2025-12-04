# Plano de Testes - Conectividade e Modo Offline

## Objetivo
Validar o comportamento do aplicativo em cenarios de internet instavel, lenta e modo offline.

---

## TC-NET-001: Perda Total de Internet Durante Uso
**Prioridade:** P0
**Pre-condicoes:** App aberto, usuario logado, internet funcionando

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Navegar normalmente pelo app | Tudo funciona |
| 2 | Desativar WiFi e dados moveis | App detecta em <5s |
| 3 | Verificar indicador | Banner "Sem conexao" aparece |
| 4 | Tentar criar viagem | Mensagem "Voce esta offline" |
| 5 | Navegar para tela de perfil | Dados em cache sao exibidos |
| 6 | Reativar internet | Banner some, app sincroniza |

**Validacoes:**
- [ ] App NAO deve crashar
- [ ] Dados em cache devem ser exibidos
- [ ] Acoes que requerem rede devem ser bloqueadas com mensagem clara
- [ ] Reconexao deve ser automatica

---

## TC-NET-002: Internet Lenta (2G/Edge)
**Prioridade:** P0
**Pre-condicoes:** Usar throttling para simular 2G (50kbps)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir app | Carrega com loading visivel |
| 2 | Fazer login | Completa em <30s com feedback |
| 3 | Carregar lista de viagens | Loading spinner visivel |
| 4 | Fazer upload de foto | Progress bar visivel, nao trava |
| 5 | Timeout apos 60s sem resposta | Mensagem "Conexao lenta, tente novamente" |

**Importante:** NUNCA deixar usuario sem feedback. Sempre mostrar loading.

---

## TC-NET-003: Conexao Intermitente
**Prioridade:** P0
**Pre-condicoes:** Simular conexao que cai a cada 10 segundos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar cadastro de veiculo | Formulario carrega |
| 2 | Preencher dados | Dados locais preservados |
| 3 | Conexao cai durante submit | Retry automatico |
| 4 | Conexao retorna | Submit completa sem perder dados |
| 5 | Verificar dados salvos | Tudo persistido corretamente |

---

## TC-NET-004: Transicao WiFi para 4G
**Prioridade:** P1
**Pre-condicoes:** Conectado ao WiFi, 4G disponivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Usar app no WiFi | Funciona normalmente |
| 2 | Desativar WiFi | Transicao para 4G automatica |
| 3 | Verificar se houve interrupcao | Maximo 2s de delay |
| 4 | Continuar navegando | Sem erros ou reloads |

---

## TC-NET-005: Transicao 4G para WiFi
**Prioridade:** P1
**Pre-condicoes:** Conectado ao 4G, WiFi disponivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Usar app no 4G | Funciona normalmente |
| 2 | Ativar WiFi | Transicao automatica |
| 3 | Verificar sessao | Mantida sem re-login |
| 4 | Verificar requests pendentes | Completados sem erro |

---

## TC-NET-006: Cache de Dados Offline
**Prioridade:** P1
**Pre-condicoes:** Usuario logado com dados carregados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Carregar perfil e veiculos | Dados exibidos |
| 2 | Desativar internet | Banner offline aparece |
| 3 | Fechar e reabrir app | Dados em cache exibidos |
| 4 | Verificar dados visiveis | Perfil, veiculo, ultimas viagens |
| 5 | Tentar editar dados | Bloqueado ou salvo localmente |

**Dados que DEVEM estar em cache:**
- [x] Perfil do usuario
- [x] Dados do veiculo
- [x] Ultimas 10 viagens
- [x] Configuracoes do app
- [ ] Mensagens recentes

---

## TC-NET-007: Fila de Requisicoes Offline
**Prioridade:** P1
**Pre-condicoes:** App funcionando, usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Desativar internet | App detecta offline |
| 2 | Tentar atualizar status de entrega | Acao enfileirada |
| 3 | Tentar enviar mensagem | Acao enfileirada |
| 4 | Verificar indicador | "2 acoes pendentes" |
| 5 | Reativar internet | Fila processada automaticamente |
| 6 | Verificar acoes | Todas sincronizadas |

---

## TC-NET-008: Timeout de Requisicoes
**Prioridade:** P1
**Pre-condicoes:** Servidor lento ou inacessivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fazer requisicao ao servidor | Loading inicia |
| 2 | Servidor nao responde | Timeout apos 30s |
| 3 | Verificar mensagem | "Servidor indisponivel, tente novamente" |
| 4 | Botao de retry | Disponivel e funcional |
| 5 | Servidor volta | Retry funciona |

---

## TC-NET-009: Upload de Imagem com Conexao Lenta
**Prioridade:** P0
**Pre-condicoes:** Simular conexao lenta (100kbps)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar foto do veiculo (2MB) | Foto selecionada |
| 2 | Iniciar upload | Progress bar aparece |
| 3 | Acompanhar progresso | % atualiza corretamente |
| 4 | Aguardar conclusao | Upload completa (pode demorar) |
| 5 | Conexao cai durante upload | Retry automatico do ponto onde parou |

**Validacoes:**
- [ ] Progress bar deve ser precisa
- [ ] Upload deve ser resumivel (chunked)
- [ ] Timeout minimo de 5 minutos para uploads
- [ ] Compressao de imagem antes do envio

---

## TC-NET-010: Reconexao Automatica com Exponential Backoff
**Prioridade:** P2
**Pre-condicoes:** App offline

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Desativar internet | App detecta |
| 2 | Verificar tentativas de reconexao | 1a tentativa em 1s |
| 3 | Aguardar | 2a tentativa em 2s |
| 4 | Aguardar | 3a tentativa em 4s |
| 5 | Aguardar | 4a tentativa em 8s |
| 6 | Verificar limite | Para em 30s, aguarda acao do usuario |

---

## TC-NET-011: Sincronizacao de Dados Apos Periodo Offline Longo
**Prioridade:** P1
**Pre-condicoes:** App offline por 24 horas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Manter app offline por 24h | Token pode expirar |
| 2 | Reativar internet | App tenta sincronizar |
| 3 | Se token expirado | Redirect para login |
| 4 | Fazer login | Dados atualizados corretamente |
| 5 | Verificar conflitos | Resolvidos automaticamente ou notificados |

---

## TC-NET-012: WebSocket Reconnection
**Prioridade:** P0
**Pre-condicoes:** Motorista em entrega com cliente acompanhando

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Estabelecer conexao WebSocket | Conectado |
| 2 | Perder internet por 10s | WebSocket desconecta |
| 3 | Internet retorna | WebSocket reconecta automaticamente |
| 4 | Verificar estado | Sincronizado, sem perda de dados |
| 5 | Cliente continua vendo posicao | Atualizacoes retomam |

---

## TC-NET-013: Conflito de Dados (Race Condition)
**Prioridade:** P1
**Pre-condicoes:** Dados alterados offline e online simultaneamente

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Editar perfil offline | Salvo localmente |
| 2 | Admin edita mesmo perfil online | Salvo no servidor |
| 3 | App reconecta | Detecta conflito |
| 4 | Resolver conflito | Prioriza versao mais recente ou notifica usuario |

---

## Matriz de Teste de Conectividade

| Cenario | WiFi | 4G | 3G | 2G | Offline |
|---------|------|-----|-----|-----|---------|
| Login | OK | OK | Lento | Timeout | Bloqueado |
| Ver perfil | OK | OK | OK | Lento | Cache |
| Upload foto | OK | OK | Lento | Falha | Fila |
| Ver mapa | OK | OK | Lento | Muito lento | Cache |
| Chat | OK | OK | OK | Lento | Fila |
| Tracking | OK | OK | OK | Degradado | Pausa |

---

## Ferramentas de Teste

### Android
- **Network Link Conditioner** (configuracoes de desenvolvedor)
- **Charles Proxy** com throttling
- **Comando ADB:** `adb shell svc wifi disable`

### iOS
- **Network Link Conditioner** (Xcode > Additional Tools)
- **Charles Proxy** com throttling
- **Configuracoes > Developer > Network Link Conditioner**

### Perfis de Rede para Teste

| Perfil | Download | Upload | Latencia |
|--------|----------|--------|----------|
| WiFi rapido | 50 Mbps | 20 Mbps | 10ms |
| 4G bom | 10 Mbps | 5 Mbps | 50ms |
| 4G ruim | 2 Mbps | 500 Kbps | 200ms |
| 3G | 400 Kbps | 100 Kbps | 400ms |
| 2G/Edge | 50 Kbps | 20 Kbps | 1000ms |
| Muito ruim | 10 Kbps | 5 Kbps | 3000ms |

---

## Checklist de Regressao Conectividade

- [ ] Login offline (deve falhar graciosamente)
- [ ] Login com internet lenta
- [ ] Navegacao offline com cache
- [ ] Upload de foto com internet lenta
- [ ] Transicao WiFi -> 4G
- [ ] Transicao 4G -> WiFi
- [ ] Perda total de conexao durante uso
- [ ] Reconexao automatica
- [ ] WebSocket reconnection
- [ ] Fila de acoes offline
- [ ] Sincronizacao apos reconexao
- [ ] Timeout adequado em todas as telas

---

## Bugs Conhecidos

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| NET-001 | App trava ao perder conexao durante upload | Corrigido | 1.1.5 |
| NET-002 | Cache nao limpa apos logout | Aberto | 1.2.0 |
| NET-003 | WebSocket nao reconecta em iOS background | Investigando | 1.2.0 |
