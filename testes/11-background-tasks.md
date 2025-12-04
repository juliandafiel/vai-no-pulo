# Plano de Testes - Background Tasks e Servicos em Segundo Plano

## Objetivo
Validar o comportamento de tarefas executadas em segundo plano: tracking, sincronizacao, notificacoes e uploads.

---

## LOCATION TRACKING EM BACKGROUND

### TC-BG-001: Tracking Continua com App Minimizado
**Prioridade:** P0
**Pre-condicoes:** Motorista com entrega em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar entrega | Tracking ativo |
| 2 | Minimizar app (Home) | Notificacao persistente aparece |
| 3 | Usar outros apps por 10 min | Tracking continua |
| 4 | Verificar posicao no admin | Atualizada em tempo real |
| 5 | Abrir app novamente | Sem gaps no historico |

**Notificacao Persistente deve mostrar:**
- [x] "Viagem em andamento"
- [x] Nome do destino
- [x] Botao de acao rapida

---

### TC-BG-002: Tracking com Tela Bloqueada
**Prioridade:** P0
**Pre-condicoes:** Entrega em andamento, tela bloqueada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Bloquear tela do dispositivo | Tela apaga |
| 2 | Andar 1km | GPS deve continuar |
| 3 | Verificar no admin | Posicoes registradas |
| 4 | Desbloquear tela | App atualizado |

---

### TC-BG-003: Tracking Apos Sistema Matar App
**Prioridade:** P0
**Pre-condicoes:** Entrega ativa, dispositivo com pouca memoria

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar entrega | Tracking ativo |
| 2 | Abrir muitos apps (estressar memoria) | Sistema pode matar Vai no Pulo |
| 3 | Verificar | Servico de tracking deve ser reiniciado |
| 4 | Abrir app | Reconecta e sincroniza |

**Android:** Usar WorkManager para resiliencia
**iOS:** Usar Background Location Updates + Significant Location Changes

---

### TC-BG-004: Tracking em Modo Economia de Energia
**Prioridade:** P0
**Pre-condicoes:** Modo economia de energia ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ativar modo economia | Sistema restringe background |
| 2 | Iniciar entrega | Aviso: "Modo economia pode afetar tracking" |
| 3 | Verificar tracking | Funciona (pode ter menor frequencia) |
| 4 | Sugerir desativar | "Para melhor experiencia, desative economia" |

---

### TC-BG-005: Tracking com Bateria Critica (<15%)
**Prioridade:** P1
**Pre-condicoes:** Bateria abaixo de 15%

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar entrega com bateria baixa | Aviso exibido |
| 2 | Continuar entrega | Tracking funciona |
| 3 | Bateria chega a 5% | Alerta: "Bateria critica" |
| 4 | Bateria chega a 1% | Salva ultima posicao, notifica suporte |

---

## SINCRONIZACAO DE DADOS

### TC-BG-006: Sincronizacao Periodica
**Prioridade:** P1
**Pre-condicoes:** App em background, com internet

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Deixar app em background | Servico de sync ativo |
| 2 | Aguardar 15 minutos | Sync automatico ocorre |
| 3 | Verificar dados | Novos pedidos baixados |
| 4 | Verificar notificacao | Se houver pedido novo, notifica |

**Frequencia de Sync:**
- App aberto: Tempo real (WebSocket)
- Background (motorista ativo): A cada 5 minutos
- Background (sem viagem): A cada 15 minutos
- Background (cliente): A cada 30 minutos

---

### TC-BG-007: Sincronizacao Apos Reconexao
**Prioridade:** P0
**Pre-condicoes:** App offline por periodo prolongado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ficar offline por 1 hora | Dados nao sincronizam |
| 2 | Acoes offline enfileiradas | Fila local criada |
| 3 | Reconectar internet | Sync automatico inicia |
| 4 | Verificar fila | Todas acoes processadas |
| 5 | Verificar dados | Atualizados corretamente |

---

### TC-BG-008: Conflito de Sincronizacao
**Prioridade:** P1
**Pre-condicoes:** Mesmo dado alterado em dois lugares

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Editar perfil offline | Dado A = "X" local |
| 2 | Admin edita online | Dado A = "Y" servidor |
| 3 | Reconectar | Conflito detectado |
| 4 | Resolucao | Versao mais recente vence (timestamp) |
| 5 | Ou | Notifica usuario para resolver |

---

## UPLOAD EM BACKGROUND

### TC-BG-009: Upload de Foto Continua em Background
**Prioridade:** P0
**Pre-condicoes:** Upload de foto grande em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar upload de foto 5MB | Progress 20% |
| 2 | Minimizar app | Upload continua |
| 3 | Usar outros apps | Upload progride |
| 4 | Verificar conclusao | Upload completa em background |
| 5 | Notificacao | "Foto enviada com sucesso" |

---

### TC-BG-010: Upload Retomado Apos Interrupcao
**Prioridade:** P0
**Pre-condicoes:** Upload em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar upload | Progress 50% |
| 2 | Perder conexao | Upload pausa |
| 3 | Fechar app completamente | Estado salvo |
| 4 | Reabrir app com internet | Upload retoma do 50% |
| 5 | Verificar | Nao reinicia do zero |

---

## NOTIFICACOES EM BACKGROUND

### TC-BG-011: Push Notification com App Fechado
**Prioridade:** P0
**Pre-condicoes:** App completamente fechado (nao em background)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fechar app completamente | App nao esta rodando |
| 2 | Enviar push do servidor | Push chega ao dispositivo |
| 3 | Verificar notificacao | Aparece na bandeja |
| 4 | Tocar na notificacao | App abre na tela correta |

---

### TC-BG-012: Push Notification com App em Foreground
**Prioridade:** P1
**Pre-condicoes:** App aberto e em uso

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Usar app normalmente | App ativo |
| 2 | Receber push | In-app notification aparece |
| 3 | Verificar som/vibracao | Feedback ao usuario |
| 4 | Tocar na notificacao | Navega para conteudo |

---

### TC-BG-013: Notificacao de Novo Pedido (Motorista)
**Prioridade:** P0
**Pre-condicoes:** Motorista disponivel, app em background

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente faz pedido na rota do motorista | Servidor processa |
| 2 | Push enviado | Chega em <5 segundos |
| 3 | Conteudo da notificacao | "Novo pedido disponivel!" |
| 4 | Som especial | Som de notificacao de pedido |
| 5 | Tocar | Abre detalhes do pedido |

---

### TC-BG-014: Notificacao de Atualizacao de Status (Cliente)
**Prioridade:** P0
**Pre-condicoes:** Cliente com pedido ativo, app em background

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista coleta mercadoria | Status muda para "COLLECTED" |
| 2 | Push enviado ao cliente | "Sua mercadoria foi coletada!" |
| 3 | Cliente toca | Abre tela de rastreamento |

**Status que geram notificacao:**
- [x] Pedido aceito pelo motorista
- [x] Motorista a caminho da coleta
- [x] Mercadoria coletada
- [x] Motorista a caminho da entrega
- [x] Entrega realizada
- [x] Pedido cancelado

---

## WEBSOCKET EM BACKGROUND

### TC-BG-015: WebSocket Reconnection
**Prioridade:** P0
**Pre-condicoes:** WebSocket conectado, app em background

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Conexao WebSocket ativa | Status: connected |
| 2 | Minimizar app | WebSocket pode ser desconectado pelo OS |
| 3 | Trazer app para frente | Reconexao automatica |
| 4 | Verificar tempo | <3 segundos |
| 5 | Verificar estado | Sincronizado |

---

### TC-BG-016: Heartbeat/Ping em Background
**Prioridade:** P1
**Pre-condicoes:** App em background por periodo prolongado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | App em background | Heartbeat ativo |
| 2 | A cada 30s | Ping enviado ao servidor |
| 3 | Servidor valida | Motorista "online" |
| 4 | Sem ping por 2min | Motorista marcado "away" |
| 5 | Sem ping por 10min | Motorista marcado "offline" |

---

## AGENDAMENTO DE TAREFAS

### TC-BG-017: Lembrete de Viagem Agendada
**Prioridade:** P1
**Pre-condicoes:** Viagem agendada para daqui 2 horas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Agendar viagem para 14:00 | Viagem criada |
| 2 | As 12:00 | Notificacao: "Sua viagem comeca em 2 horas" |
| 3 | As 13:30 | Notificacao: "Sua viagem comeca em 30 minutos" |
| 4 | As 13:55 | Notificacao: "Sua viagem comeca em 5 minutos" |

---

### TC-BG-018: Limpeza de Cache Periodica
**Prioridade:** P2
**Pre-condicoes:** App instalado ha muito tempo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | App acumula cache | Imagens, dados temporarios |
| 2 | Semanalmente | Limpeza automatica de cache antigo |
| 3 | Verificar espaco | Cache reduzido |
| 4 | Dados importantes | Preservados |

---

## RESTRICOES DO SISTEMA OPERACIONAL

### TC-BG-019: Doze Mode (Android)
**Prioridade:** P0
**Pre-condicoes:** Android 6+, dispositivo parado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Deixar dispositivo parado | Doze mode ativa |
| 2 | Verificar tracking | Reduzido mas funcionando |
| 3 | Movimento detectado | Tracking volta ao normal |
| 4 | Verificar Jobs | WorkManager funciona |

---

### TC-BG-020: App Standby Buckets (Android 9+)
**Prioridade:** P1
**Pre-condicoes:** Android 9+

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Nao usar app por dias | Bucket: "Rare" |
| 2 | Verificar restricoes | Jobs mais restritos |
| 3 | Abrir app | Bucket melhora |
| 4 | Usar regularmente | Bucket: "Active" |

---

### TC-BG-021: Background App Refresh (iOS)
**Prioridade:** P0
**Pre-condicoes:** iOS, configuracao de sistema

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Desativar Background App Refresh | Sistema > Geral > Atualizar em 2o Plano |
| 2 | Verificar tracking | Pode ser afetado |
| 3 | Exibir aviso | "Para melhor experiencia, ative..." |
| 4 | Com BAR ativo | Funciona normalmente |

---

## TESTES DE ESTRESSE

### TC-BG-022: Background por 8 Horas (Dia de Trabalho)
**Prioridade:** P0
**Pre-condicoes:** Motorista simulando dia de trabalho

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar jornada as 8h | Tracking ativo |
| 2 | Fazer entregas ate 17h | 9 horas de uso |
| 3 | App em background maior parte | Normal para motorista |
| 4 | Verificar no fim do dia | Tracking continuo, sem falhas |
| 5 | Verificar bateria | Consumo aceitavel (<30%) |
| 6 | Verificar memoria | Sem memory leaks |

---

### TC-BG-023: Multiplas Transicoes Foreground/Background
**Prioridade:** P1
**Pre-condicoes:** App funcional

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir app | Foreground |
| 2 | Minimizar | Background |
| 3 | Repetir 50x | Alternar rapidamente |
| 4 | Verificar estabilidade | Sem crashes |
| 5 | Verificar memoria | Sem leaks |
| 6 | Verificar estados | Corretos apos cada transicao |

---

## CHECKLIST DE REGRESSAO - BACKGROUND TASKS

### Tracking
- [ ] Tracking com app minimizado
- [ ] Tracking com tela bloqueada
- [ ] Tracking apos sistema matar app
- [ ] Tracking em modo economia
- [ ] Tracking com bateria critica

### Sincronizacao
- [ ] Sync periodico funciona
- [ ] Sync apos reconexao
- [ ] Conflitos resolvidos corretamente
- [ ] Fila offline processada

### Upload
- [ ] Upload continua em background
- [ ] Upload retomado apos interrupcao
- [ ] Progress salvo corretamente

### Notificacoes
- [ ] Push com app fechado
- [ ] Push com app em foreground
- [ ] Push de novo pedido (motorista)
- [ ] Push de status (cliente)
- [ ] Deep linking funciona

### WebSocket
- [ ] Reconexao automatica
- [ ] Heartbeat funcionando
- [ ] Status online/offline correto

### Agendamento
- [ ] Lembretes enviados no horario
- [ ] Limpeza de cache funciona

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| BG-001 | Tracking para apos 1h em iOS background | Investigando | 1.2.0 |
| BG-002 | WebSocket nao reconecta em Android 13 | Corrigido | 1.1.5 |
| BG-003 | Memory leak em transicoes repetidas | Aberto | 1.2.0 |
| BG-004 | Push nao abre tela correta em Android | Aberto | 1.2.0 |

---

## FERRAMENTAS DE TESTE

### Android
- **ADB shell dumpsys battery unplug**: Simula desconexao de energia
- **ADB shell dumpsys deviceidle force-idle**: Forca Doze mode
- **Android Profiler**: Monitorar memoria, CPU, rede

### iOS
- **Instruments (Xcode)**: Profiling
- **Energy Log**: Verificar consumo de energia
- **Console app**: Ver logs do sistema

### Monitoramento
- **Firebase Crashlytics**: Crashes em background
- **Firebase Performance**: Metricas de background tasks
- **Analytics**: Eventos de background/foreground
