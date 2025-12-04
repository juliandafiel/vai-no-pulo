# Plano de Testes - GPS e Localizacao

## Objetivo
Validar o comportamento do aplicativo em cenarios de uso de GPS, perda de sinal e reconexao.

---

## TC-GPS-001: Permissao de Localizacao - Primeira Execucao
**Prioridade:** P0
**Pre-condicoes:** App instalado pela primeira vez, permissoes nao concedidas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir o app | Solicita permissao de localizacao |
| 2 | Negar permissao | Exibe mensagem explicando necessidade |
| 3 | Tocar em "Permitir" | Abre configuracoes do sistema |
| 4 | Conceder permissao "Sempre" | Retorna ao app com localizacao ativa |

**Cenarios Alternativos:**
- [ ] Conceder apenas "Durante uso do app"
- [ ] Conceder "Apenas uma vez"
- [ ] Manter negado permanentemente

---

## TC-GPS-002: Perda Total de Sinal GPS
**Prioridade:** P0
**Pre-condicoes:** Motorista em viagem ativa, GPS funcionando

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar viagem com destino | Mapa carrega, rota exibida |
| 2 | Entrar em tunel/garagem (sem GPS) | Exibe indicador "Buscando GPS..." |
| 3 | Aguardar 30 segundos | Usa ultima posicao conhecida |
| 4 | Aguardar mais 60 segundos | Exibe alerta "Sinal GPS perdido" |
| 5 | Sair do tunel | Reconecta automaticamente em <10s |
| 6 | Verificar rota | Rota recalculada a partir da nova posicao |

**Validacoes Criticas:**
- [ ] App NAO deve crashar
- [ ] Viagem NAO deve ser cancelada automaticamente
- [ ] Historico de posicoes deve ser preservado
- [ ] Deve tentar reconexao automatica a cada 5s

---

## TC-GPS-003: GPS com Precisao Baixa
**Prioridade:** P1
**Pre-condicoes:** Motorista em area com sinal fraco (entre predios altos)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir mapa em area urbana densa | Localizacao aproximada exibida |
| 2 | Verificar indicador de precisao | Mostra circulo de incerteza no mapa |
| 3 | Caminhar 50 metros | Posicao deve atualizar gradualmente |
| 4 | Verificar endereco detectado | Tolera erro de ate 50 metros |

**Metricas de Aceitacao:**
- Precisao minima aceitavel: 50 metros
- Frequencia de atualizacao: minimo 1x por segundo em movimento
- Consumo de bateria: maximo 5% por hora em uso ativo

---

## TC-GPS-004: Reconexao Apos Modo Aviao
**Prioridade:** P1
**Pre-condicoes:** App aberto com GPS ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ativar modo aviao | GPS desativa, app detecta |
| 2 | Aguardar 10 segundos | Exibe estado "Sem conexao" |
| 3 | Desativar modo aviao | Inicia reconexao automatica |
| 4 | Aguardar reconexao | GPS ativo em menos de 15 segundos |
| 5 | Verificar posicao | Posicao atual correta |

---

## TC-GPS-005: Background Location Tracking
**Prioridade:** P0
**Pre-condicoes:** Motorista com entrega em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar entrega | Tracking ativo |
| 2 | Minimizar app (ir para home) | Notificacao persistente aparece |
| 3 | Usar outro app por 5 minutos | Tracking continua em background |
| 4 | Verificar admin panel | Posicao atualizada em tempo real |
| 5 | Abrir app novamente | Posicao sincronizada, sem gaps |

**Testes Adicionais de Background:**
- [ ] Teste com app em background por 30 minutos
- [ ] Teste com app em background por 2 horas
- [ ] Teste com dispositivo em modo economia de energia
- [ ] Teste apos sistema matar o app

---

## TC-GPS-006: Geocoding - Endereco para Coordenadas
**Prioridade:** P1
**Pre-condicoes:** App com acesso a internet

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Buscar "Av. Paulista, 1000" | Sugestoes aparecem em <2s |
| 2 | Selecionar endereco | Coordenadas corretas retornadas |
| 3 | Verificar no mapa | Pin no local correto |
| 4 | Buscar endereco inexistente | Mensagem "Endereco nao encontrado" |

**Casos de Borda:**
- [ ] Endereco com caracteres especiais (acentos)
- [ ] Endereco muito longo
- [ ] Buscar apenas numero (sem rua)
- [ ] Buscar CEP
- [ ] Buscar ponto de referencia ("Shopping X")

---

## TC-GPS-007: Reverse Geocoding - Coordenadas para Endereco
**Prioridade:** P1
**Pre-condicoes:** GPS ativo com posicao valida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Usar localizacao atual" | Detecta coordenadas |
| 2 | Aguardar conversao | Endereco formatado exibido em <3s |
| 3 | Verificar endereco | Corresponde ao local fisico |

---

## TC-GPS-008: Simulacao de Rota (Mock Location)
**Prioridade:** P2
**Pre-condicoes:** Dispositivo de desenvolvimento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ativar "Localizacoes simuladas" no Android | Funcionalidade ativa |
| 2 | Usar app de mock GPS | App DEVE detectar localizacao falsa |
| 3 | Tentar iniciar entrega | BLOQUEAR com mensagem de seguranca |

**Nota:** Em producao, deve-se detectar e bloquear GPS falso para evitar fraudes.

---

## TC-GPS-009: Consumo de Bateria
**Prioridade:** P1
**Pre-condicoes:** Bateria em 100%, GPS ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar monitoramento de bateria | Registrar nivel inicial |
| 2 | Usar app com GPS por 1 hora | Registrar consumo |
| 3 | Calcular taxa de consumo | Maximo 8% por hora |

**Benchmarks Aceitaveis:**
- App em foreground com mapa: max 10%/hora
- App em background tracking: max 5%/hora
- App idle (sem tracking): max 1%/hora

---

## TC-GPS-010: Multiplos Apps Usando GPS
**Prioridade:** P2
**Pre-condicoes:** Vai no Pulo + Google Maps + Waze instalados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir Vai no Pulo com entrega ativa | GPS tracking ativo |
| 2 | Abrir Google Maps em navegacao | Ambos recebem localizacao |
| 3 | Alternar entre apps | Sem conflito, ambos funcionam |
| 4 | Verificar precisao em ambos | Localizacao consistente |

---

## TC-GPS-011: Atualizacao de Posicao em Tempo Real (WebSocket)
**Prioridade:** P0
**Pre-condicoes:** Motorista em entrega, cliente acompanhando

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista inicia entrega | Cliente ve posicao inicial |
| 2 | Motorista se move 100 metros | Cliente ve atualizacao em <3s |
| 3 | Verificar frequencia | Atualizacao a cada 3-5 segundos |
| 4 | Motorista para | Posicao estabiliza |

---

## Checklist de Regressao GPS

- [ ] Permissao concedida/negada
- [ ] GPS indoor (shopping, garagem)
- [ ] GPS outdoor (area aberta)
- [ ] Transicao indoor/outdoor
- [ ] Modo aviao ligado/desligado
- [ ] Bateria baixa (<15%)
- [ ] Dispositivo em modo economia
- [ ] Background por 5 minutos
- [ ] Background por 30 minutos
- [ ] Background por 2 horas
- [ ] Reconexao apos perda total
- [ ] Precisao em area urbana densa
- [ ] Precisao em area rural
- [ ] Consumo de bateria aceitavel
- [ ] Tracking em tempo real para cliente

---

## Bugs Conhecidos

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| GPS-001 | Posicao "pula" ao sair de tunel | Aberto | 1.2.0 |
| GPS-002 | Tracking para apos 1h em background no iOS | Investigando | 1.2.0 |

---

## Notas do QA

1. **iOS vs Android:** O iOS e mais restritivo com background location. Testar separadamente.
2. **Android 12+:** Novas restricoes de localizacao aproximada vs precisa.
3. **Emuladores:** GPS em emulador nao e confiavel. Sempre testar em dispositivo real.
4. **Tuneis reais:** Identificar tuneis na regiao para testes de campo.
