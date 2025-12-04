# Plano de Testes - Performance e Otimizacao

## Objetivo
Validar a performance do aplicativo em diferentes cenarios: tempo de resposta, uso de recursos, comportamento sob carga.

---

## TEMPO DE CARREGAMENTO

### TC-PERF-001: Tempo de Inicializacao do App (Cold Start)
**Prioridade:** P0
**Pre-condicoes:** App fechado, primeira inicializacao

| Metrica | Aceitavel | Bom | Critico |
|---------|-----------|-----|---------|
| Splash ate login | <3s | <2s | >5s |
| Login ate dashboard | <2s | <1s | >4s |
| Dashboard completo | <3s | <2s | >5s |

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Matar app completamente | App fechado |
| 2 | Cronometrar abertura | Timer iniciado |
| 3 | Splash screen | Exibida imediatamente |
| 4 | Tela de login | <3s |
| 5 | Fazer login | - |
| 6 | Dashboard carregado | <2s apos login |

---

### TC-PERF-002: Tempo de Inicializacao (Warm Start)
**Prioridade:** P1
**Pre-condicoes:** App em background

| Metrica | Aceitavel | Bom | Critico |
|---------|-----------|-----|---------|
| Background ate ativo | <1s | <0.5s | >2s |

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | App em background | Minimizado |
| 2 | Trazer para frente | Cronometrar |
| 3 | App ativo | <1s |
| 4 | Dados atualizados | <2s |

---

### TC-PERF-003: Carregamento de Lista de Pedidos
**Prioridade:** P0
**Pre-condicoes:** Usuario com 50+ pedidos

| Quantidade | Tempo Aceitavel |
|------------|-----------------|
| 10 pedidos | <1s |
| 50 pedidos | <2s |
| 100 pedidos | <3s |
| 500+ pedidos | Paginacao obrigatoria |

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar lista de pedidos | Loading inicia |
| 2 | Primeira pagina | Carrega em <1s |
| 3 | Scroll para baixo | Paginacao suave |
| 4 | Carregar mais | <1s por pagina |

---

### TC-PERF-004: Carregamento de Mapa
**Prioridade:** P0
**Pre-condicoes:** Tela com mapa

| Metrica | Aceitavel | Bom | Critico |
|---------|-----------|-----|---------|
| Mapa visivel | <2s | <1s | >4s |
| Tiles carregados | <3s | <2s | >5s |
| Marcadores | <1s | <0.5s | >2s |

---

### TC-PERF-005: Calculo de Rota
**Prioridade:** P0
**Pre-condicoes:** Origem e destino definidos

| Distancia | Tempo Aceitavel |
|-----------|-----------------|
| Ate 10km | <2s |
| 10-50km | <3s |
| 50-200km | <4s |
| 200km+ | <5s |

---

## USO DE MEMORIA

### TC-PERF-006: Consumo de Memoria Base
**Prioridade:** P0
**Pre-condicoes:** App recem aberto

| Estado | Memoria Aceitavel (iOS) | Memoria Aceitavel (Android) |
|--------|------------------------|----------------------------|
| Login | <80MB | <100MB |
| Dashboard | <120MB | <150MB |
| Com mapa | <180MB | <220MB |
| Tracking ativo | <200MB | <250MB |

---

### TC-PERF-007: Teste de Memory Leak
**Prioridade:** P0
**Pre-condicoes:** App funcional

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Medir memoria inicial | Baseline |
| 2 | Navegar por 10 telas | Memoria aumenta |
| 3 | Voltar para inicio | Memoria deve reduzir |
| 4 | Repetir 10x | Memoria nao deve crescer indefinidamente |
| 5 | Comparar com baseline | Delta <20% |

**Cenarios de teste:**
- [ ] Abrir/fechar lista de pedidos 50x
- [ ] Abrir/fechar mapa 30x
- [ ] Enviar/receber mensagens 100x
- [ ] Upload/visualizar fotos 20x
- [ ] Transicao foreground/background 50x

---

### TC-PERF-008: Memoria Durante Tracking Prolongado
**Prioridade:** P0
**Pre-condicoes:** Tracking ativo por 4+ horas

| Hora | Memoria Esperada |
|------|------------------|
| Inicio | ~150MB |
| 1 hora | <170MB |
| 2 horas | <190MB |
| 4 horas | <220MB |
| 8 horas | <250MB |

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar tracking | Memoria baseline |
| 2 | Monitorar a cada hora | Registro de valores |
| 3 | Verificar crescimento | Linear e controlado |
| 4 | Sem crash | App estavel |

---

## USO DE CPU

### TC-PERF-009: CPU em Idle
**Prioridade:** P1
**Pre-condicoes:** App aberto, sem acao

| Estado | CPU Aceitavel |
|--------|---------------|
| Dashboard (idle) | <5% |
| Lista (idle) | <3% |
| Mapa (idle) | <10% |

---

### TC-PERF-010: CPU Durante Operacoes
**Prioridade:** P1
**Pre-condicoes:** App em uso ativo

| Operacao | CPU Aceitavel |
|----------|---------------|
| Scroll de lista | <30% |
| Carregamento de tela | <50% |
| Upload de foto | <40% |
| Calculo de rota | <60% |
| Tracking GPS | <15% |

---

## USO DE BATERIA

### TC-PERF-011: Consumo de Bateria - Uso Normal
**Prioridade:** P0
**Pre-condicoes:** Bateria 100%, uso normal por 1 hora

| Uso | Consumo Aceitavel/Hora |
|-----|------------------------|
| Navegando no app | <8% |
| Tracking ativo | <12% |
| Mapa + tracking | <15% |
| Background (motorista) | <5% |
| Background (cliente) | <2% |

---

### TC-PERF-012: Consumo de Bateria - Dia de Trabalho
**Prioridade:** P0
**Pre-condicoes:** Motorista em jornada de 8 horas

| Metrica | Valor Esperado |
|---------|----------------|
| Consumo total | <70% da bateria |
| Media por hora | ~8-9% |
| Picos | Durante navegacao ativa |

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar jornada (100%) | Baseline |
| 2 | 2 horas | ~80% restante |
| 3 | 4 horas | ~60% restante |
| 4 | 6 horas | ~40% restante |
| 5 | 8 horas | ~30% restante |

---

## USO DE REDE

### TC-PERF-013: Consumo de Dados - Operacoes Normais
**Prioridade:** P1
**Pre-condicoes:** Monitoramento de rede ativo

| Operacao | Dados Esperados |
|----------|-----------------|
| Login | <50KB |
| Carregar dashboard | <100KB |
| Lista de pedidos (10) | <30KB |
| Detalhes de pedido | <20KB |
| Carregar mapa (tile) | ~200KB |
| Tracking (por minuto) | <5KB |

---

### TC-PERF-014: Consumo de Dados - Dia de Trabalho
**Prioridade:** P1
**Pre-condicoes:** Motorista em jornada de 8 horas

| Metrica | Valor Esperado |
|---------|----------------|
| Tracking continuo | ~50MB |
| Mapas (cache hit) | ~20MB |
| Mapas (cache miss) | ~100MB |
| Fotos (upload) | Variavel |
| Total estimado | <200MB |

---

### TC-PERF-015: Compressao e Cache
**Prioridade:** P1
**Pre-condicoes:** Monitoramento de rede

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar headers | gzip/deflate ativo |
| 2 | Repetir mesma requisicao | Cache hit |
| 3 | Verificar ETags | Funcionando |
| 4 | Imagens | Cache local |

---

## TESTES DE CARGA (BACKEND)

### TC-PERF-016: Carga Simultanea de Usuarios
**Prioridade:** P0
**Pre-condicoes:** Ambiente de teste

| Usuarios | Tempo de Resposta |
|----------|-------------------|
| 100 | <200ms |
| 500 | <500ms |
| 1000 | <1s |
| 5000 | <2s |

---

### TC-PERF-017: Pico de Requisicoes
**Prioridade:** P0
**Pre-condicoes:** Ambiente de teste com load testing

| Requisicoes/s | Comportamento Esperado |
|---------------|------------------------|
| 100 | Normal |
| 500 | Normal |
| 1000 | Pode degradar levemente |
| 5000 | Rate limiting ativo |

---

### TC-PERF-018: Requisicoes de Tracking
**Prioridade:** P0
**Pre-condicoes:** Muitos motoristas ativos

| Motoristas Ativos | Updates/s | Latencia |
|-------------------|-----------|----------|
| 100 | 20/s | <100ms |
| 500 | 100/s | <200ms |
| 1000 | 200/s | <500ms |
| 5000 | 1000/s | <1s |

---

## TESTES DE ESTRESSE

### TC-PERF-019: Operacao com Memoria Baixa
**Prioridade:** P1
**Pre-condicoes:** Dispositivo com muitos apps abertos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir muitos apps | Estressar memoria |
| 2 | Usar Vai no Pulo | Funciona normalmente |
| 3 | Verificar | Pode ficar mais lento |
| 4 | Sem crash | App NAO deve fechar |
| 5 | Dados preservados | Nenhuma perda |

---

### TC-PERF-020: Operacao com Armazenamento Baixo
**Prioridade:** P1
**Pre-condicoes:** Dispositivo com pouco espaco

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Encher armazenamento | <100MB livre |
| 2 | Abrir app | Funciona |
| 3 | Tentar upload | Aviso de espaco |
| 4 | Liberar espaco | Upload funciona |

---

### TC-PERF-021: Operacao com CPU Estressada
**Prioridade:** P2
**Pre-condicoes:** Outros apps consumindo CPU

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Rodar apps intensivos | CPU alta |
| 2 | Usar Vai no Pulo | Mais lento |
| 3 | Operacoes criticas | Ainda funcionam |
| 4 | UI | Pode ter lag |

---

## OTIMIZACOES

### TC-PERF-022: Lazy Loading de Imagens
**Prioridade:** P1
**Pre-condicoes:** Lista com muitas imagens

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir lista com 50 itens | Scroll suave |
| 2 | Imagens visiveis | Carregam primeiro |
| 3 | Imagens fora da tela | Carregam sob demanda |
| 4 | Scroll rapido | Placeholders exibidos |

---

### TC-PERF-023: Paginacao Infinita
**Prioridade:** P1
**Pre-condicoes:** Lista com 100+ itens

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Carregar primeira pagina | 20 itens |
| 2 | Scroll ate fim | Carrega mais |
| 3 | Indicador de loading | Visivel |
| 4 | Fim da lista | "Nao ha mais itens" |

---

### TC-PERF-024: Cache de Dados
**Prioridade:** P0
**Pre-condicoes:** Dados carregados previamente

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Carregar perfil | Requisicao ao servidor |
| 2 | Sair da tela | Cache armazenado |
| 3 | Voltar para perfil | Cache usado (instantaneo) |
| 4 | Pull-to-refresh | Atualiza do servidor |

---

## METRICAS E MONITORAMENTO

### Metricas a Coletar
- [ ] Tempo de carregamento de cada tela
- [ ] Tempo de resposta de API
- [ ] Uso de memoria por tela
- [ ] Crashes e ANRs (Android)
- [ ] Memoria warnings (iOS)
- [ ] Taxa de frames (FPS)
- [ ] Consumo de bateria
- [ ] Uso de dados moveis

### Ferramentas
- **iOS:** Instruments, Xcode Profiler
- **Android:** Android Profiler, Systrace
- **Backend:** New Relic, Datadog, CloudWatch
- **Load Testing:** JMeter, k6, Locust

---

## CHECKLIST DE REGRESSAO - PERFORMANCE

### Tempo de Carregamento
- [ ] Cold start <3s
- [ ] Warm start <1s
- [ ] Dashboard <2s
- [ ] Mapa <3s
- [ ] Lista de pedidos <2s

### Memoria
- [ ] Baseline <150MB
- [ ] Sem memory leaks
- [ ] Tracking 4h <250MB

### CPU/Bateria
- [ ] Idle <5%
- [ ] Tracking <15%
- [ ] Bateria (8h) <70%

### Rede
- [ ] Tracking <5KB/min
- [ ] Cache funcionando
- [ ] Compressao ativa

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| PERF-001 | Memory leak em lista de pedidos | Corrigido | 1.1.6 |
| PERF-002 | Mapa consome muita bateria | Investigando | 1.2.0 |
| PERF-003 | ANR ao carregar historico grande | Aberto | 1.2.0 |
| PERF-004 | Cold start lento em Android Go | Aberto | 1.2.0 |

---

## NOTAS DO QA

1. **Dispositivos reais:** Performance varia muito entre dispositivos
2. **Rede real:** Testar em 3G/4G, nao apenas WiFi
3. **Bateria:** Testar com bateria em diferentes niveis
4. **Background:** Monitorar consumo em background
5. **Profiling:** Usar ferramentas nativas para medidas precisas
6. **Baseline:** Estabelecer metricas baseline por build
