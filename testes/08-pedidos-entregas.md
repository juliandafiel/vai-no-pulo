# Plano de Testes - Pedidos e Entregas

## Objetivo
Validar o fluxo completo de pedidos: criacao, aceite, coleta, entrega e finalizacao.

---

## CRIACAO DE PEDIDO (CLIENTE)

### TC-PED-001: Criar Pedido Simples
**Prioridade:** P0
**Pre-condicoes:** Cliente logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Novo Pedido" | Tela de criacao abre |
| 2 | Inserir endereco de coleta | Autocomplete funciona |
| 3 | Inserir endereco de entrega | Autocomplete funciona |
| 4 | Selecionar tipo de volume | Pequeno/Medio/Grande |
| 5 | Inserir descricao | Campo de texto |
| 6 | Ver preco estimado | Calculado automaticamente |
| 7 | Confirmar | Pedido criado |
| 8 | Status | "Aguardando motorista" |

---

### TC-PED-002: Estimativa de Preco
**Prioridade:** P0
**Pre-condicoes:** Enderecos de coleta e entrega definidos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Definir origem e destino | Enderecos validos |
| 2 | Calcular distancia | Exibida em km |
| 3 | Calcular tempo estimado | Exibido em minutos |
| 4 | Calcular preco | Baseado em distancia + tipo |
| 5 | Mostrar detalhamento | Taxa base + km + volume |

**Formula de preco:**
- Taxa base: R$ X
- Por km: R$ Y
- Volume pequeno: +0%
- Volume medio: +20%
- Volume grande: +50%

---

### TC-PED-003: Validacao de Endereco
**Prioridade:** P0
**Pre-condicoes:** Campo de endereco

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Digitar endereco parcial | Sugestoes aparecem |
| 2 | Selecionar sugestao | Endereco completo preenchido |
| 3 | Verificar no mapa | Marcador no local correto |
| 4 | Ajustar se necessario | Pin arrastavel |
| 5 | Endereco invalido | Erro: "Endereco nao encontrado" |

---

### TC-PED-004: Tipos de Volume
**Prioridade:** P1
**Pre-condicoes:** Criando pedido

| Tipo | Dimensoes | Peso Max | Veiculo |
|------|-----------|----------|---------|
| Documento | Envelope | 1kg | Moto/Carro |
| Pequeno | 30x30x30cm | 5kg | Moto/Carro |
| Medio | 60x60x60cm | 20kg | Carro/Van |
| Grande | 100x100x100cm | 50kg | Van/Caminhao |
| Especial | Personalizado | Variavel | Sob consulta |

---

### TC-PED-005: Agendamento de Pedido
**Prioridade:** P1
**Pre-condicoes:** Cliente criando pedido

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar "Agendar entrega" | Date/time picker |
| 2 | Escolher data | Calendario exibido |
| 3 | Escolher horario | Slots disponiveis |
| 4 | Data no passado | Bloqueado |
| 5 | Confirmar | Pedido agendado |
| 6 | Notificacao | Lembrete antes da coleta |

---

### TC-PED-006: Pedido com Retorno
**Prioridade:** P2
**Pre-condicoes:** Cliente precisa de ida e volta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ativar "Preciso de retorno" | Opcao selecionada |
| 2 | Definir tempo de espera | Ex: 30 minutos |
| 3 | Calcular preco | Inclui ida + espera + volta |
| 4 | Confirmar | Pedido com retorno criado |

---

## ACEITE DE PEDIDO (MOTORISTA)

### TC-PED-007: Visualizar Pedidos Disponiveis
**Prioridade:** P0
**Pre-condicoes:** Motorista online

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar lista de pedidos | Pedidos proximos exibidos |
| 2 | Ver detalhes rapidos | Distancia, valor, tipo |
| 3 | Ordenar por | Distancia / Valor / Tempo |
| 4 | Filtrar por | Tipo de volume |

---

### TC-PED-008: Aceitar Pedido
**Prioridade:** P0
**Pre-condicoes:** Pedido disponivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar no pedido | Detalhes completos |
| 2 | Ver rota | Mapa com origem-destino |
| 3 | Ver estimativas | Tempo, distancia, valor |
| 4 | Tocar em "Aceitar" | Confirmacao |
| 5 | Pedido aceito | Status: "A caminho da coleta" |
| 6 | Cliente notificado | Push: "Motorista a caminho" |

---

### TC-PED-009: Tempo Limite para Aceite
**Prioridade:** P1
**Pre-condicoes:** Pedido oferecido ao motorista

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Pedido aparece | Timer de 30s |
| 2 | Nao aceitar em 30s | Pedido vai para outro motorista |
| 3 | Recusar | Pedido sai da lista |
| 4 | Recusar muitos | Possivel penalizacao |

---

### TC-PED-010: Recusar Pedido
**Prioridade:** P1
**Pre-condicoes:** Pedido oferecido

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Recusar" | Modal de confirmacao |
| 2 | Selecionar motivo | Lista de motivos |
| 3 | Confirmar | Pedido removido |
| 4 | Pedido vai para outro | Sistema redistribui |

**Motivos de recusa:**
- [ ] Distancia muito grande
- [ ] Tipo de volume incompativel
- [ ] Horario incompativel
- [ ] Regiao nao atendida
- [ ] Outro

---

## COLETA

### TC-PED-011: Navegar ate Coleta
**Prioridade:** P0
**Pre-condicoes:** Pedido aceito

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ver botao "Navegar" | Disponivel |
| 2 | Tocar | Abre app de navegacao |
| 3 | Seguir rota | GPS guia ate origem |
| 4 | Chegar ao local | Deteccao automatica (opcional) |

---

### TC-PED-012: Confirmar Chegada na Coleta
**Prioridade:** P0
**Pre-condicoes:** Motorista no local de coleta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Chegar ao endereco | Botao "Cheguei" aparece |
| 2 | Tocar em "Cheguei" | Status: "No local de coleta" |
| 3 | Cliente notificado | Push: "Motorista chegou" |
| 4 | Timer de espera | Inicia (se aplicavel) |

---

### TC-PED-013: Coletar Mercadoria
**Prioridade:** P0
**Pre-condicoes:** Motorista no local

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber mercadoria | Conferir com descricao |
| 2 | Tirar foto (opcional) | Documentar estado |
| 3 | Tocar em "Coletei" | Confirmacao |
| 4 | Codigo de confirmacao | Inserir codigo do remetente |
| 5 | Status | "A caminho da entrega" |
| 6 | Cliente notificado | Push: "Mercadoria coletada" |

---

### TC-PED-014: Problema na Coleta
**Prioridade:** P1
**Pre-condicoes:** Motorista no local, problema encontrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Reportar problema" | Modal de problemas |
| 2 | Selecionar tipo | Lista de problemas |
| 3 | Descrever | Campo de texto |
| 4 | Foto (opcional) | Documentar |
| 5 | Enviar | Suporte notificado |

**Tipos de problema:**
- [ ] Remetente ausente
- [ ] Endereco incorreto
- [ ] Volume diferente do informado
- [ ] Mercadoria danificada
- [ ] Mercadoria proibida

---

## ENTREGA

### TC-PED-015: Navegar ate Entrega
**Prioridade:** P0
**Pre-condicoes:** Mercadoria coletada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Rota para destino | Calculada automaticamente |
| 2 | Ver tempo estimado | Exibido |
| 3 | Navegar | App de navegacao |
| 4 | Cliente ve localizacao | Tracking em tempo real |

---

### TC-PED-016: Confirmar Chegada na Entrega
**Prioridade:** P0
**Pre-condicoes:** Motorista no destino

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Chegar ao endereco | Botao "Cheguei" |
| 2 | Tocar | Status: "No local de entrega" |
| 3 | Cliente notificado | Push: "Motorista chegou" |
| 4 | Contactar destinatario | Botao de ligacao/chat |

---

### TC-PED-017: Confirmar Entrega
**Prioridade:** P0
**Pre-condicoes:** Mercadoria entregue

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Entregar mercadoria | Fisicamente |
| 2 | Coletar assinatura | Assinatura digital |
| 3 | OU codigo de confirmacao | Destinatario fornece |
| 4 | Tirar foto | Comprovante de entrega |
| 5 | Tocar em "Entreguei" | Confirmacao |
| 6 | Status | "Entregue" |
| 7 | Todos notificados | Push para cliente |

---

### TC-PED-018: Destinatario Ausente
**Prioridade:** P0
**Pre-condicoes:** Motorista no local, destinatario ausente

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar contato | Ligacao/mensagem |
| 2 | Aguardar 10 minutos | Timer visivel |
| 3 | Sem resposta | Opcoes disponiveis |
| 4 | Reportar | "Destinatario ausente" |
| 5 | Definir proximo passo | Devolver / Deixar com vizinho |

---

### TC-PED-019: Entrega com Terceiro
**Prioridade:** P1
**Pre-condicoes:** Destinatario autorizou terceiro

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Terceiro recebe | Confirmar identidade |
| 2 | Coletar nome | Campo obrigatorio |
| 3 | Coletar documento | RG ou CPF |
| 4 | Assinatura | Do terceiro |
| 5 | Foto | Comprovante |
| 6 | Finalizar | Entrega confirmada |

---

## TRACKING EM TEMPO REAL

### TC-PED-020: Cliente Acompanha Entrega
**Prioridade:** P0
**Pre-condicoes:** Pedido em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente abre pedido | Mapa com motorista |
| 2 | Localizacao atualiza | A cada 5-10 segundos |
| 3 | Ver ETA | Tempo estimado de chegada |
| 4 | Ver status | Fase atual do pedido |
| 5 | Notificacoes | Em cada mudanca de status |

---

### TC-PED-021: Status do Pedido
**Prioridade:** P0
**Pre-condicoes:** Pedido criado

| Status | Descricao | Notificacao |
|--------|-----------|-------------|
| PENDING | Aguardando motorista | - |
| ACCEPTED | Motorista aceitou | "Motorista a caminho" |
| AT_PICKUP | Motorista na coleta | "Motorista chegou para coletar" |
| COLLECTED | Mercadoria coletada | "Mercadoria coletada" |
| IN_TRANSIT | Em transito | - |
| AT_DELIVERY | Motorista no destino | "Motorista chegou" |
| DELIVERED | Entregue | "Entrega realizada!" |
| CANCELLED | Cancelado | "Pedido cancelado" |

---

### TC-PED-022: Comunicacao Motorista-Cliente
**Prioridade:** P1
**Pre-condicoes:** Pedido em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista toca em chat | Chat abre |
| 2 | Enviar mensagem | Entregue ao cliente |
| 3 | Cliente responde | Motorista recebe |
| 4 | Ligacao | Numero mascarado |

---

## AVALIACAO

### TC-PED-023: Cliente Avalia Motorista
**Prioridade:** P1
**Pre-condicoes:** Entrega concluida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Entrega finalizada | Modal de avaliacao |
| 2 | Dar estrelas (1-5) | Selecao obrigatoria |
| 3 | Escrever comentario | Opcional |
| 4 | Dar gorjeta | Opcional |
| 5 | Enviar | Avaliacao salva |

---

### TC-PED-024: Motorista Avalia Cliente
**Prioridade:** P2
**Pre-condicoes:** Entrega concluida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Finalizar entrega | Modal de avaliacao |
| 2 | Dar estrelas (1-5) | Selecao |
| 3 | Reportar problema | Se necessario |
| 4 | Enviar | Avaliacao salva |

---

## HISTORICO

### TC-PED-025: Historico de Pedidos (Cliente)
**Prioridade:** P1
**Pre-condicoes:** Cliente com pedidos anteriores

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Meus Pedidos" | Lista de pedidos |
| 2 | Filtrar por status | Todos / Entregues / Cancelados |
| 3 | Filtrar por data | Range de datas |
| 4 | Ver detalhes | Tela de detalhes |
| 5 | Repetir pedido | Formulario pre-preenchido |

---

### TC-PED-026: Historico de Entregas (Motorista)
**Prioridade:** P1
**Pre-condicoes:** Motorista com entregas realizadas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Minhas Entregas" | Lista de entregas |
| 2 | Ver ganhos do dia | Valor total |
| 3 | Ver ganhos do mes | Valor acumulado |
| 4 | Ver detalhes | Rota, tempo, valor |
| 5 | Exportar | PDF ou CSV |

---

## CHECKLIST DE REGRESSAO - PEDIDOS

### Criacao
- [ ] Criar pedido simples
- [ ] Estimativa de preco
- [ ] Validacao de endereco
- [ ] Tipos de volume
- [ ] Agendamento

### Aceite
- [ ] Visualizar pedidos
- [ ] Aceitar pedido
- [ ] Recusar pedido
- [ ] Tempo limite

### Coleta
- [ ] Navegar ate coleta
- [ ] Confirmar chegada
- [ ] Coletar mercadoria
- [ ] Reportar problema

### Entrega
- [ ] Navegar ate entrega
- [ ] Confirmar chegada
- [ ] Confirmar entrega
- [ ] Destinatario ausente
- [ ] Entrega com terceiro

### Tracking
- [ ] Localizacao em tempo real
- [ ] Status atualizando
- [ ] Notificacoes
- [ ] Chat motorista-cliente

### Avaliacao
- [ ] Cliente avalia motorista
- [ ] Motorista avalia cliente

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| PED-001 | Preco nao atualiza ao mudar endereco | Corrigido | 1.1.5 |
| PED-002 | Tracking trava apos 30 minutos | Investigando | 1.2.0 |
| PED-003 | Push de entrega duplicado | Aberto | 1.2.0 |
| PED-004 | Assinatura nao salva em Android | Corrigido | 1.1.8 |

---

## NOTAS DO QA

1. **Fluxo completo:** Testar pedido do inicio ao fim
2. **Tracking:** Verificar precisao e frequencia
3. **Notificacoes:** Todas devem chegar no momento certo
4. **Offline:** Testar comportamento sem internet
5. **Concorrencia:** Dois motoristas aceitando mesmo pedido
6. **Timeout:** Verificar comportamento com servidor lento
