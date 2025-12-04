# Plano de Testes - Viagens e Rotas Longas

## Objetivo
Validar criacao de viagens, calculo de rotas, navegacao e cenarios de rotas longas (>100km).

---

## CRIACAO DE VIAGEM

### TC-VIA-001: Criar Viagem Simples (Origem-Destino)
**Prioridade:** P0
**Pre-condicoes:** Motorista logado, veiculo aprovado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Nova Viagem" | Tela de criacao abre |
| 2 | Selecionar origem | Usar localizacao atual ou buscar |
| 3 | Selecionar destino | Buscar endereco |
| 4 | Selecionar data/hora | Date picker abre |
| 5 | Verificar distancia | Calculada automaticamente |
| 6 | Verificar tempo estimado | Calculado automaticamente |
| 7 | Confirmar | Viagem criada |

---

### TC-VIA-002: Criar Viagem com Multiplas Paradas
**Prioridade:** P1
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Criar viagem com origem e destino | Viagem basica |
| 2 | Tocar em "Adicionar parada" | Campo adicional aparece |
| 3 | Adicionar 3 paradas intermediarias | Todas adicionadas |
| 4 | Verificar ordem | Drag-and-drop para reordenar |
| 5 | Verificar rota | Recalculada com todas paradas |
| 6 | Verificar tempo | Inclui tempo em cada parada |

---

### TC-VIA-003: Validacao de Data/Hora
**Prioridade:** P1
**Pre-condicoes:** Criando viagem

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar data no passado | Erro: "Data invalida" |
| 2 | Data muito futura (+6 meses) | Erro: "Data muito distante" |
| 3 | Horario de madrugada (2h-5h) | Aviso: "Horario incomum" |
| 4 | Data valida | Aceita |

---

## CALCULO DE ROTA

### TC-VIA-004: Calculo de Rota Simples
**Prioridade:** P0
**Pre-condicoes:** Origem e destino definidos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Definir Sao Paulo -> Campinas | ~100km |
| 2 | Aguardar calculo | Rota calculada em <3s |
| 3 | Verificar distancia | 95-105km (tolerancia) |
| 4 | Verificar tempo | 1h20-1h40 (com trafego) |
| 5 | Verificar rota no mapa | Linha tracada corretamente |

---

### TC-VIA-005: Rota com Pedagios
**Prioridade:** P1
**Pre-condicoes:** Rota que passa por pedagios

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Criar rota SP -> Campinas | Rota calculada |
| 2 | Verificar aviso de pedagio | "Esta rota tem X pedagios" |
| 3 | Verificar custo estimado | Valor dos pedagios |
| 4 | Opcao evitar pedagios | Disponivel |
| 5 | Recalcular sem pedagios | Rota alternativa (mais longa) |

---

### TC-VIA-006: Rota com Restricoes de Veiculo
**Prioridade:** P1
**Pre-condicoes:** Motorista com caminhao

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Criar rota com caminhao | Rota calculada |
| 2 | Verificar restricoes | Evita vias com limite de peso/altura |
| 3 | Verificar rodizio (se aplicavel) | Aviso sobre horarios restritos |
| 4 | Rota alternativa | Considera restricoes |

---

## ROTAS LONGAS (>100km)

### TC-VIA-007: Rota Longa - Sao Paulo -> Rio de Janeiro (430km)
**Prioridade:** P0
**Pre-condicoes:** Motorista disponivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Criar viagem SP -> RJ | Rota calculada |
| 2 | Verificar tempo | ~5-6 horas |
| 3 | Sugerir paradas | "Parada recomendada: Taubate" |
| 4 | Iniciar viagem | Tracking ativo |
| 5 | Simular trajeto completo | GPS funciona por 6 horas |
| 6 | Verificar bateria | Consumo aceitavel |

**Pontos de verificacao na rota:**
- [ ] Inicio correto
- [ ] Passagem por Taubate (checkpoint)
- [ ] Passagem por Resende (checkpoint)
- [ ] Chegada ao destino

---

### TC-VIA-008: Rota Muito Longa - Sao Paulo -> Salvador (1900km)
**Prioridade:** P1
**Pre-condicoes:** Motorista de longa distancia

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Criar viagem SP -> Salvador | Rota calculada |
| 2 | Verificar tempo | ~24-28 horas |
| 3 | Aviso de seguranca | "Viagem longa, planeje paradas" |
| 4 | Sugerir pernoites | Pontos de parada recomendados |
| 5 | Aviso de descanso | A cada 4 horas de direcao |

---

### TC-VIA-009: Tracking de Rota Longa (Teste de Duracao)
**Prioridade:** P0
**Pre-condicoes:** Rota de 4+ horas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar viagem longa | Tracking ativo |
| 2 | Hora 1 | GPS funcionando, bateria OK |
| 3 | Hora 2 | Lembrete de pausa se necessario |
| 4 | Hora 3 | Verificar memoria do app |
| 5 | Hora 4 | Alerta de descanso obrigatorio |
| 6 | Conclusao | Rota completa, todos dados salvos |

**Metricas a monitorar:**
- Consumo de bateria por hora
- Uso de memoria (memory leaks)
- Precisao do GPS ao longo do tempo
- Quantidade de dados moveis usados

---

### TC-VIA-010: Desvio de Rota em Viagem Longa
**Prioridade:** P0
**Pre-condicoes:** Viagem em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Seguir rota por 50km | Rota correta |
| 2 | Pegar saida errada | Sair da rota |
| 3 | Detectar desvio | "Recalculando rota..." |
| 4 | Nova rota | Calculada em <5s |
| 5 | Verificar ETA | Atualizado |
| 6 | Retornar a rota original | Se for mais curto |

---

### TC-VIA-011: Parada Nao Planejada em Rota Longa
**Prioridade:** P1
**Pre-condicoes:** Viagem em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Parar em posto de gasolina | GPS detecta parada |
| 2 | Veiculo parado por 15 min | Status: "Em parada" |
| 3 | Cliente ve status | "Motorista em breve parada" |
| 4 | Retomar viagem | Tracking continua |
| 5 | ETA recalculado | Considera tempo de parada |

---

## NAVEGACAO

### TC-VIA-012: Instrucoes Turn-by-Turn
**Prioridade:** P1
**Pre-condicoes:** Viagem iniciada, GPS ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar navegacao | Primeira instrucao exibida |
| 2 | Aproximar de curva | "Em 200m, vire a direita" |
| 3 | Instrucao por voz | Audio da instrucao |
| 4 | Fazer a curva | Proxima instrucao aparece |
| 5 | Verificar instrucoes | Precisas e no tempo certo |

---

### TC-VIA-013: Recalculo por Trafego
**Prioridade:** P1
**Pre-condicoes:** Integracao com dados de trafego

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar rota | Rota otimizada |
| 2 | Congestionamento detectado | Aviso: "Trafego intenso a frente" |
| 3 | Rota alternativa | Oferecida ao motorista |
| 4 | Aceitar alternativa | Rota recalculada |
| 5 | ETA atualizado | Reflete nova rota |

---

### TC-VIA-014: Navegacao Offline (Mapas Baixados)
**Prioridade:** P2
**Pre-condicoes:** Mapas offline baixados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Baixar mapa da regiao | Download completo |
| 2 | Desativar internet | Modo offline |
| 3 | Iniciar navegacao | Funciona com mapa offline |
| 4 | Verificar instrucoes | Disponiveis offline |
| 5 | Reconectar | Sincroniza dados pendentes |

---

## TESTES DE LIMITE

### TC-VIA-015: Muitas Paradas (Limite do Sistema)
**Prioridade:** P2
**Pre-condicoes:** Tentando criar viagem complexa

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Adicionar 5 paradas | OK |
| 2 | Adicionar 10 paradas | OK ou aviso |
| 3 | Adicionar 20 paradas | Limite atingido? |
| 4 | Verificar calculo | Tempo aceitavel (<10s) |
| 5 | Verificar rota | Otimizada |

---

### TC-VIA-016: Endereco de Dificil Acesso
**Prioridade:** P1
**Pre-condicoes:** Endereco em area rural/remota

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Buscar endereco rural | Encontrado (se existir) |
| 2 | Calcular rota | Rota calculada |
| 3 | Verificar trecho final | Pode nao ter nome de rua |
| 4 | Usar coordenadas | Alternativa disponivel |
| 5 | Aviso de dificuldade | "Acesso pode ser dificil" |

---

### TC-VIA-017: Rota Internacional (Brasil -> Pais Vizinho)
**Prioridade:** P3
**Pre-condicoes:** Destino em pais vizinho (se aplicavel)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Buscar endereco no Uruguai | Encontrado |
| 2 | Calcular rota | Rota com fronteira |
| 3 | Aviso especial | "Esta rota cruza fronteira internacional" |
| 4 | Verificar restricoes | Documentacao necessaria |

---

## HISTORICO DE VIAGENS

### TC-VIA-018: Visualizar Historico
**Prioridade:** P1
**Pre-condicoes:** Varias viagens realizadas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir historico | Lista de viagens anteriores |
| 2 | Filtrar por periodo | Filtro funciona |
| 3 | Ver detalhes de uma viagem | Rota, distancia, duracao real |
| 4 | Ver rota no mapa | Trajeto real exibido |
| 5 | Exportar dados | PDF ou CSV disponivel |

---

### TC-VIA-019: Repetir Viagem Anterior
**Prioridade:** P2
**Pre-condicoes:** Viagem no historico

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar viagem anterior | Detalhes exibidos |
| 2 | Tocar em "Repetir viagem" | Formulario pre-preenchido |
| 3 | Ajustar data/hora | Alteracao simples |
| 4 | Confirmar | Nova viagem criada |

---

## CHECKLIST DE REGRESSAO - VIAGENS E ROTAS

### Criacao de Viagem
- [ ] Viagem simples (origem-destino)
- [ ] Viagem com multiplas paradas
- [ ] Validacao de data/hora
- [ ] Selecao de origem por GPS
- [ ] Busca de endereco funciona

### Calculo de Rota
- [ ] Distancia calculada corretamente
- [ ] Tempo estimado razoavel
- [ ] Pedagios detectados
- [ ] Restricoes de veiculo
- [ ] Rota exibida no mapa

### Rotas Longas
- [ ] Rota 100km funciona
- [ ] Rota 500km funciona
- [ ] Tracking por 4+ horas
- [ ] Desvio de rota recalcula
- [ ] Paradas detectadas
- [ ] Bateria aceitavel
- [ ] Sem memory leaks

### Navegacao
- [ ] Instrucoes turn-by-turn
- [ ] Instrucoes por voz
- [ ] Recalculo por trafego
- [ ] Mapas offline (se disponivel)

---

## METRICAS DE PERFORMANCE

| Operacao | Tempo Aceitavel | Tempo Critico |
|----------|-----------------|---------------|
| Calculo de rota simples | <3s | >5s |
| Calculo de rota longa | <5s | >10s |
| Recalculo por desvio | <3s | >5s |
| Atualizacao de GPS | <1s | >3s |
| Carregamento de mapa | <2s | >5s |

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| VIA-001 | Rota sumindo apos 2h de uso | Investigando | 1.2.0 |
| VIA-002 | Pedagio incorreto na Bandeirantes | Aberto | 1.2.0 |
| VIA-003 | Recalculo lento com muitas paradas | Aberto | 1.2.0 |

---

## NOTAS DO QA

1. **Testar em dispositivos reais:** Emuladores nao simulam bem rotas longas
2. **Monitorar bateria:** Rotas longas consomem muita bateria
3. **Testar com dados moveis:** WiFi nao e realista para navegacao
4. **Verificar precisao:** Comparar com Google Maps/Waze
5. **Testar areas rurais:** Cobertura de GPS pode ser ruim
