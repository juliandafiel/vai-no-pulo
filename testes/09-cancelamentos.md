# Plano de Testes - Cancelamentos e Fluxos Alternativos

## Objetivo
Validar todos os cenarios de cancelamento, fluxos alternativos e situacoes excepcionais.

---

## CANCELAMENTOS PELO MOTORISTA

### TC-CAN-001: Motorista Cancela Viagem Antes de Iniciar
**Prioridade:** P0
**Pre-condicoes:** Viagem criada, ainda nao iniciada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir detalhes da viagem | Detalhes exibidos |
| 2 | Tocar em "Cancelar viagem" | Modal de confirmacao |
| 3 | Selecionar motivo | Lista de motivos disponiveis |
| 4 | Confirmar cancelamento | Viagem cancelada |
| 5 | Verificar status | "CANCELLED" |
| 6 | Verificar notificacao | Clientes notificados |

**Motivos de cancelamento (motorista):**
- [ ] Problema mecanico no veiculo
- [ ] Emergencia pessoal
- [ ] Condicoes climaticas adversas
- [ ] Mudanca de planos
- [ ] Outro (campo livre)

---

### TC-CAN-002: Motorista Cancela Viagem com Pedidos Confirmados
**Prioridade:** P0
**Pre-condicoes:** Viagem com 3 pedidos confirmados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar cancelar viagem | Aviso: "Esta viagem tem 3 pedidos confirmados" |
| 2 | Confirmar cancelamento | Todos os pedidos marcados como "CANCELLED_BY_DRIVER" |
| 3 | Verificar notificacoes | Todos os 3 clientes notificados |
| 4 | Verificar reembolso | Processo de reembolso iniciado |
| 5 | Verificar penalidade | Motorista recebe penalidade (se aplicavel) |

**Regras de Penalidade:**
- 1o cancelamento/mes: Aviso
- 2o cancelamento/mes: Reducao de visibilidade
- 3o+ cancelamentos/mes: Suspensao temporaria

---

### TC-CAN-003: Motorista Cancela Durante a Viagem
**Prioridade:** P0
**Pre-condicoes:** Viagem em andamento (status: IN_PROGRESS)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar cancelar | Aviso: "Viagem em andamento. Tem certeza?" |
| 2 | Motivo obrigatorio | Deve preencher motivo |
| 3 | Confirmar | Viagem interrompida |
| 4 | Entregas pendentes | Status: "INTERRUPTED" |
| 5 | Cliente pode solicitar outro motorista | Opcao disponivel |

---

## CANCELAMENTOS PELO CLIENTE

### TC-CAN-004: Cliente Cancela Pedido Antes da Coleta
**Prioridade:** P0
**Pre-condicoes:** Pedido confirmado, motorista ainda nao coletou

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir pedido | Detalhes exibidos |
| 2 | Tocar em "Cancelar pedido" | Modal de confirmacao |
| 3 | Selecionar motivo | Lista de motivos |
| 4 | Confirmar | Pedido cancelado |
| 5 | Verificar reembolso | Reembolso total (se ja pagou) |
| 6 | Motorista notificado | Push notification enviada |

**Prazos e Taxas:**
- Cancelamento ate 2h antes: Reembolso 100%
- Cancelamento 2h-30min antes: Reembolso 80%
- Cancelamento <30min: Reembolso 50%
- Apos coleta: Sem reembolso

---

### TC-CAN-005: Cliente Cancela Apos Coleta
**Prioridade:** P0
**Pre-condicoes:** Mercadoria ja coletada pelo motorista

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar cancelar | Aviso: "Mercadoria ja foi coletada" |
| 2 | Opcao disponivel | "Solicitar devolucao ao remetente" |
| 3 | Confirmar | Taxa de retorno aplicada |
| 4 | Motorista notificado | Retornar ao ponto de origem |
| 5 | Status do pedido | "RETURNING_TO_SENDER" |

---

### TC-CAN-006: Cliente Nao Encontrado na Entrega
**Prioridade:** P0
**Pre-condicoes:** Motorista chegou ao destino

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista chega | Status: "ARRIVED" |
| 2 | Cliente nao atende | Motorista tenta contato (3x) |
| 3 | Timer inicia | 15 minutos de espera |
| 4 | Timer expira | Opcao: "Cliente nao encontrado" |
| 5 | Confirmar | Mercadoria retorna ou fica em ponto de coleta |
| 6 | Cliente notificado | "Tentativa de entrega falhou" |

---

## FLUXOS ALTERNATIVOS

### TC-ALT-001: Endereco de Entrega Incorreto
**Prioridade:** P1
**Pre-condicoes:** Motorista em rota para entrega

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente percebe erro no endereco | Abre chat com motorista |
| 2 | Solicita alteracao | Motorista ve solicitacao |
| 3 | Motorista aceita | Novo endereco definido |
| 4 | Recalculo de rota | GPS atualiza destino |
| 5 | Possivel taxa adicional | Se distancia aumentar significativamente |

---

### TC-ALT-002: Mercadoria Recusada pelo Destinatario
**Prioridade:** P1
**Pre-condicoes:** Motorista tentando entregar

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista oferece mercadoria | Destinatario recusa |
| 2 | Motorista registra | "Entrega recusada" + motivo |
| 3 | Tirar foto | Prova da tentativa |
| 4 | Cliente (remetente) notificado | Opcoes: reenviar ou devolver |
| 5 | Status | "DELIVERY_REFUSED" |

---

### TC-ALT-003: Mercadoria Danificada Durante Transporte
**Prioridade:** P0
**Pre-condicoes:** Mercadoria no veiculo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista percebe dano | Registra ocorrencia |
| 2 | Tirar fotos | Documentar dano |
| 3 | Notificar cliente | Push + email |
| 4 | Cliente decide | Aceitar mesmo assim ou recusar |
| 5 | Registro de sinistro | Aberto automaticamente |
| 6 | Seguro acionado | Se aplicavel |

---

### TC-ALT-004: Veiculo Quebra Durante Viagem
**Prioridade:** P0
**Pre-condicoes:** Viagem em andamento com entregas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista registra problema | "Problema no veiculo" |
| 2 | Selecionar tipo | Pneu, motor, bateria, etc |
| 3 | Sistema reage | Busca motorista substituto |
| 4 | Transferencia de carga | Coordenar com novo motorista |
| 5 | Clientes notificados | "Seu pedido foi transferido" |
| 6 | Motorista original | Penalidade? Nao (forca maior) |

---

### TC-ALT-005: Acidente de Transito
**Prioridade:** P0
**Pre-condicoes:** Motorista em rota

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista registra acidente | Botao de emergencia |
| 2 | Coleta informacoes | Gravidade, feridos, etc |
| 3 | Se grave | Aciona suporte imediatamente |
| 4 | Viagem suspensa | Status: "EMERGENCY_STOP" |
| 5 | Clientes notificados | "Imprevistos no trajeto" |
| 6 | Redistribuicao | Sistema busca alternativas |

---

### TC-ALT-006: Motorista Passa Mal
**Prioridade:** P0
**Pre-condicoes:** Motorista ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista aciona emergencia | Botao SOS |
| 2 | Confirmacao | "Voce precisa de ajuda medica?" |
| 3 | Se sim | Contato de emergencia notificado |
| 4 | Viagem pausada | Status: "DRIVER_EMERGENCY" |
| 5 | Suporte assume | Contato com motorista e clientes |

---

### TC-ALT-007: Chuva Forte / Condicoes Climaticas
**Prioridade:** P1
**Pre-condicoes:** Alerta meteorologico na regiao

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Sistema detecta alerta | Integra com API meteorologica |
| 2 | Notifica motoristas | "Condicoes adversas previstas" |
| 3 | Motorista pode pausar | "Aguardando melhora do tempo" |
| 4 | Clientes notificados | "Entrega pode atrasar" |
| 5 | Sem penalidade | Forca maior |

---

### TC-ALT-008: Greve / Bloqueio de Estradas
**Prioridade:** P1
**Pre-condicoes:** Manifestacao bloqueando rota

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista reporta | "Rota bloqueada" |
| 2 | Indica localizacao | Marca no mapa |
| 3 | Sistema calcula alternativa | Rota alternativa sugerida |
| 4 | Se impossivel | Viagem pode ser cancelada sem penalidade |
| 5 | Outros motoristas | Avisados sobre bloqueio |

---

## TIMEOUT E EXPIRACOES

### TC-EXP-001: Pedido Nao Confirmado pelo Motorista
**Prioridade:** P1
**Pre-condicoes:** Pedido aguardando aceite

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente faz pedido | Status: "PENDING" |
| 2 | Nenhum motorista aceita em 30min | Cliente notificado |
| 3 | Cliente pode | Cancelar ou aguardar mais |
| 4 | Timeout 2 horas | Pedido cancelado automaticamente |
| 5 | Reembolso | Total, automatico |

---

### TC-EXP-002: Motorista Nao Inicia Viagem
**Prioridade:** P1
**Pre-condicoes:** Viagem programada para hoje

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Horario de partida chega | Notifica motorista |
| 2 | 15 minutos sem acao | Lembrete: "Sua viagem comeca agora" |
| 3 | 30 minutos | Alerta: "Clientes aguardando" |
| 4 | 1 hora | Suporte contacta motorista |
| 5 | 2 horas | Viagem cancelada, clientes reembolsados |

---

### TC-EXP-003: Pagamento Pendente Expira
**Prioridade:** P1
**Pre-condicoes:** Pedido aguardando pagamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente confirma pedido | Status: "AWAITING_PAYMENT" |
| 2 | 15 minutos | Lembrete de pagamento |
| 3 | 30 minutos | Ultimo lembrete |
| 4 | 1 hora sem pagamento | Pedido cancelado automaticamente |
| 5 | Vaga liberada | Outros clientes podem usar |

---

## DISPUTAS E RECLAMACOES

### TC-DIS-001: Cliente Reclama de Entrega
**Prioridade:** P1
**Pre-condicoes:** Entrega concluida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente abre chamado | "Problema com entrega" |
| 2 | Seleciona categoria | Atraso, dano, extravio, etc |
| 3 | Descreve problema | Campo de texto |
| 4 | Anexa evidencias | Fotos |
| 5 | Ticket criado | Numero de protocolo |
| 6 | SLA de resposta | 24 horas |

---

### TC-DIS-002: Motorista Contesta Cancelamento
**Prioridade:** P2
**Pre-condicoes:** Motorista recebeu penalidade por cancelamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista abre contestacao | "Contestar penalidade" |
| 2 | Apresenta evidencias | Fotos, localizacao, etc |
| 3 | Suporte analisa | 48 horas |
| 4 | Se procedente | Penalidade removida |
| 5 | Se improcedente | Penalidade mantida |

---

## CHECKLIST DE REGRESSAO - CANCELAMENTOS

### Cancelamentos Basicos
- [ ] Motorista cancela antes de iniciar
- [ ] Motorista cancela durante viagem
- [ ] Cliente cancela antes da coleta
- [ ] Cliente cancela apos coleta
- [ ] Cancelamento por timeout

### Fluxos Alternativos
- [ ] Alteracao de endereco
- [ ] Mercadoria recusada
- [ ] Mercadoria danificada
- [ ] Veiculo quebra
- [ ] Acidente
- [ ] Emergencia do motorista
- [ ] Condicoes climaticas
- [ ] Bloqueio de estrada

### Notificacoes
- [ ] Cliente notificado em cancelamento
- [ ] Motorista notificado em cancelamento
- [ ] Admin notificado em emergencia
- [ ] Push notifications funcionando
- [ ] Email de confirmacao enviado

### Reembolsos
- [ ] Reembolso total processado
- [ ] Reembolso parcial processado
- [ ] Sem reembolso (apos coleta)
- [ ] Taxa de retorno aplicada

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| CAN-001 | Reembolso duplicado em cancelamento rapido | Corrigido | 1.1.2 |
| CAN-002 | Notificacao nao enviada em cancelamento offline | Aberto | 1.2.0 |
| CAN-003 | Status nao atualiza imediatamente | Investigando | 1.2.0 |

---

## NOTAS DO QA

1. **Sempre testar notificacoes:** Cancelamentos devem SEMPRE notificar todas as partes
2. **Testar offline:** Cancelamentos devem funcionar mesmo offline (sincroniza depois)
3. **Testar concorrencia:** Dois usuarios cancelando ao mesmo tempo
4. **Testar reembolso:** Verificar se o valor esta correto
5. **Testar penalidades:** Verificar se estao sendo aplicadas corretamente
