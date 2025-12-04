# Planos de Teste - Vai no Pulo

## Estrutura dos Testes

```
testes/
├── README.md                      # Este arquivo
├── 01-autenticacao.md             # Login, registro, recuperacao de senha
├── 02-perfil-motorista.md         # Perfil, documentos, configuracoes
├── 03-veiculo.md                  # Cadastro, validacao, aprovacao de veiculos
├── 04-gps-localizacao.md          # GPS, tracking, mapas
├── 05-conectividade.md            # Internet instavel, modo offline
├── 06-camera-upload.md            # Camera, galeria, upload de imagens
├── 07-viagens-rotas.md            # Viagens, rotas longas, navegacao
├── 08-pedidos-entregas.md         # Fluxo completo de pedidos
├── 09-cancelamentos.md            # Cancelamentos, fluxos alternativos
├── 10-notificacoes.md             # Push notifications, deep linking
├── 11-background-tasks.md         # Tarefas em segundo plano
├── 12-performance.md              # Performance, memoria, bateria
├── 13-seguranca.md                # Seguranca, autenticacao, LGPD
└── 14-checklist-regressao.md      # Checklist consolidado para releases
```

## Resumo dos Arquivos

| Arquivo | Casos de Teste | Prioridade Principal |
|---------|----------------|---------------------|
| 01-autenticacao.md | 27 TCs | P0 |
| 02-perfil-motorista.md | 22 TCs | P0/P1 |
| 03-veiculo.md | 20 TCs | P0 |
| 04-gps-localizacao.md | 11 TCs | P0 |
| 05-conectividade.md | 13 TCs | P0 |
| 06-camera-upload.md | 18 TCs | P0/P1 |
| 07-viagens-rotas.md | 19 TCs | P0/P1 |
| 08-pedidos-entregas.md | 26 TCs | P0 |
| 09-cancelamentos.md | 17 TCs | P0/P1 |
| 10-notificacoes.md | 30 TCs | P0 |
| 11-background-tasks.md | 23 TCs | P0 |
| 12-performance.md | 24 TCs | P0/P1 |
| 13-seguranca.md | 28 TCs | P0 |
| 14-checklist-regressao.md | Consolidado | - |
| **TOTAL** | **~280 TCs** | - |

## Legenda de Prioridade

- **P0**: Critico - Bloqueia release, funcionalidade principal
- **P1**: Alta - Deve ser corrigido antes do release
- **P2**: Media - Pode ir para producao com workaround documentado
- **P3**: Baixa - Melhorias futuras, nice-to-have

## Legenda de Status

- [ ] Pendente - Nao executado
- [x] Passou - Executado com sucesso
- [!] Falhou - Bug encontrado
- [-] Bloqueado - Dependencia nao resolvida
- [~] Em andamento - Execucao em progresso

## Nomenclatura dos Casos de Teste

Os casos de teste seguem o padrao: `TC-[AREA]-[NUMERO]`

| Prefixo | Area |
|---------|------|
| TC-AUTH | Autenticacao |
| TC-PERF | Perfil do Motorista |
| TC-VEI | Veiculo |
| TC-GPS | GPS e Localizacao |
| TC-NET | Conectividade |
| TC-CAM | Camera e Upload |
| TC-VIA | Viagens e Rotas |
| TC-PED | Pedidos e Entregas |
| TC-CAN | Cancelamentos |
| TC-ALT | Fluxos Alternativos |
| TC-NOT | Notificacoes |
| TC-BG | Background Tasks |
| TC-PERF | Performance |
| TC-SEC | Seguranca |

## Ambientes de Teste

| Ambiente | URL API | Descricao |
|----------|---------|-----------|
| DEV | localhost:3000 | Desenvolvimento local |
| STAGING | staging-api.vainopulo.com | Homologacao |
| PROD | api.vainopulo.com | Producao |

## Dispositivos de Teste

### iOS
| Modelo | Versao iOS | Tela |
|--------|------------|------|
| iPhone SE (2a geracao) | iOS 15 | 4.7" |
| iPhone 12 | iOS 16 | 6.1" |
| iPhone 14 Pro | iOS 17 | 6.1" |

### Android
| Modelo | Versao Android | RAM |
|--------|----------------|-----|
| Samsung Galaxy A32 | Android 11 | 4GB |
| Xiaomi Redmi Note 10 | Android 12 | 4GB |
| Google Pixel 6 | Android 13 | 8GB |

## Condicoes de Teste

### Obrigatorio testar em:
1. **Dispositivos reais** - Emuladores nao simulam GPS/bateria adequadamente
2. **Diferentes redes** - WiFi, 4G, 3G, 2G, offline
3. **Bateria baixa** - <20% e <5%
4. **Pouca memoria** - Muitos apps abertos
5. **Interrupcoes** - Chamadas, alarmes, notificacoes

### Cenarios especiais:
- Modo escuro/claro
- Diferentes idiomas (se suportado)
- Acessibilidade (VoiceOver/TalkBack)
- Orientacao retrato/paisagem

## Fluxo de Execucao de Testes

```
1. Preparar ambiente de teste
   └── Verificar versao do app
   └── Limpar cache/dados
   └── Verificar conectividade

2. Executar casos de teste
   └── Seguir passos documentados
   └── Registrar resultados
   └── Capturar evidencias (screenshots/videos)

3. Reportar bugs encontrados
   └── Criar issue no sistema
   └── Anexar evidencias
   └── Definir severidade

4. Registrar resultado final
   └── Preencher checklist
   └── Calcular taxa de sucesso
```

## Ferramentas Utilizadas

### Teste Manual
- Charles Proxy (interceptacao de rede)
- Network Link Conditioner (simulacao de rede)
- Android Profiler / Instruments (performance)

### Automacao (Futuro)
- Detox (React Native)
- Appium
- Jest (testes unitarios)

## Metricas de Qualidade

| Metrica | Meta | Minimo Aceitavel |
|---------|------|------------------|
| Cobertura de Teste | 90% | 80% |
| Taxa de Bugs P0 | 0 | 0 |
| Taxa de Bugs P1 | <3 por release | <5 |
| Tempo de Regressao | 4h | 6h |

## Bugs Conhecidos

Os bugs conhecidos estao documentados em cada arquivo de teste na secao "BUGS CONHECIDOS".

Consultar tambem o sistema de tracking de issues para lista atualizada.

## Historico de Releases

| Versao | Data | Bugs P0 | Bugs P1 | Status |
|--------|------|---------|---------|--------|
| 1.0.0 | - | - | - | - |
| 1.1.0 | - | - | - | - |
| 1.2.0 | - | - | - | - |

## Contato

- **QA Lead:** [Nome]
- **Email:** qa@vainopulo.com
- **Slack:** #qa-vainopulo

---

*Ultima atualizacao: Novembro 2025*
