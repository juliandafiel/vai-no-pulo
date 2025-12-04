# Plano de Testes - Notificacoes Push e In-App

## Objetivo
Validar o envio, recebimento e tratamento de notificacoes push e in-app em todos os cenarios.

---

## CONFIGURACAO DE NOTIFICACOES

### TC-NOT-001: Permissao de Notificacao (Primeira Vez)
**Prioridade:** P0
**Pre-condicoes:** App recem instalado, permissao nunca solicitada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir app pela primeira vez | - |
| 2 | Fazer login | Solicitacao de permissao |
| 3 | Conceder permissao | Notificacoes ativadas |
| 4 | Verificar | Token registrado no servidor |

---

### TC-NOT-002: Permissao Negada
**Prioridade:** P0
**Pre-condicoes:** Solicitacao de permissao exibida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Negar permissao | App continua funcionando |
| 2 | Verificar aviso | "Ative notificacoes para nao perder pedidos" |
| 3 | Acessar configuracoes do app | Opcao para ativar |
| 4 | Tocar em "Ativar" | Abre configuracoes do sistema |

---

### TC-NOT-003: Registro de Token FCM/APNs
**Prioridade:** P0
**Pre-condicoes:** Permissao concedida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | App inicia | Token FCM/APNs gerado |
| 2 | Token enviado ao backend | Registrado com usuario |
| 3 | Verificar no servidor | Token associado ao device |
| 4 | Reinstalar app | Novo token gerado |
| 5 | Token antigo | Invalidado no servidor |

---

## NOTIFICACOES DO MOTORISTA

### TC-NOT-004: Novo Pedido Disponivel
**Prioridade:** P0
**Pre-condicoes:** Motorista online, pedido compativel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente cria pedido | Servidor processa |
| 2 | Push enviado | Motorista recebe em <5s |
| 3 | Conteudo | "Novo pedido disponivel!" |
| 4 | Som | Som especial de pedido |
| 5 | Vibracao | Vibracao padrao |
| 6 | Tocar na notificacao | Abre detalhes do pedido |

**Payload esperado:**
```json
{
  "title": "Novo pedido!",
  "body": "Entrega para Centro - R$ 25,00",
  "data": {
    "type": "NEW_ORDER",
    "orderId": "123"
  }
}
```

---

### TC-NOT-005: Pedido Cancelado pelo Cliente
**Prioridade:** P0
**Pre-condicoes:** Motorista com pedido aceito

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente cancela pedido | Servidor processa |
| 2 | Push enviado | Motorista recebe |
| 3 | Conteudo | "Pedido cancelado pelo cliente" |
| 4 | Tocar | Volta para lista de pedidos |
| 5 | Pedido some | Removido da lista |

---

### TC-NOT-006: Nova Mensagem do Cliente
**Prioridade:** P1
**Pre-condicoes:** Pedido em andamento, chat ativo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cliente envia mensagem | Servidor processa |
| 2 | Push enviado | Motorista recebe |
| 3 | Conteudo | "Nova mensagem: [preview]" |
| 4 | Tocar | Abre chat com cliente |

---

### TC-NOT-007: Lembrete de Viagem Agendada
**Prioridade:** P1
**Pre-condicoes:** Viagem agendada para daqui 30 minutos

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | 30 minutos antes | Push enviado |
| 2 | Conteudo | "Sua viagem comeca em 30 minutos" |
| 3 | Tocar | Abre detalhes da viagem |

---

### TC-NOT-008: Documento Proximo do Vencimento
**Prioridade:** P1
**Pre-condicoes:** CNH vence em 7 dias

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Job diario executa | Verifica documentos |
| 2 | Push enviado | "Sua CNH vence em 7 dias" |
| 3 | Tocar | Abre secao de documentos |

---

## NOTIFICACOES DO CLIENTE

### TC-NOT-009: Motorista Aceitou Pedido
**Prioridade:** P0
**Pre-condicoes:** Pedido criado, aguardando motorista

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista aceita | Servidor processa |
| 2 | Push enviado | Cliente recebe |
| 3 | Conteudo | "Motorista Joao aceitou seu pedido!" |
| 4 | Tocar | Abre tracking do pedido |

---

### TC-NOT-010: Motorista a Caminho
**Prioridade:** P0
**Pre-condicoes:** Pedido aceito

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista inicia navegacao | Status muda |
| 2 | Push enviado | "Motorista a caminho da coleta" |
| 3 | ETA | "Chegada em ~10 minutos" |

---

### TC-NOT-011: Mercadoria Coletada
**Prioridade:** P0
**Pre-condicoes:** Motorista no local de coleta

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista confirma coleta | Status muda |
| 2 | Push enviado | "Sua mercadoria foi coletada!" |
| 3 | Tocar | Abre tracking |

---

### TC-NOT-012: Motorista Chegou para Entrega
**Prioridade:** P0
**Pre-condicoes:** Motorista no destino

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista confirma chegada | Status muda |
| 2 | Push enviado | "Motorista chegou! Aguardando voce" |
| 3 | Som | Urgente |
| 4 | Tocar | Abre tracking com contato |

---

### TC-NOT-013: Entrega Realizada
**Prioridade:** P0
**Pre-condicoes:** Entrega finalizada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista confirma entrega | Status: DELIVERED |
| 2 | Push enviado | "Entrega realizada com sucesso!" |
| 3 | Tocar | Abre tela de avaliacao |

---

### TC-NOT-014: Pedido Cancelado pelo Motorista
**Prioridade:** P0
**Pre-condicoes:** Pedido em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Motorista cancela | Servidor processa |
| 2 | Push enviado | "Seu pedido foi cancelado" |
| 3 | Conteudo | Motivo do cancelamento |
| 4 | Tocar | Abre detalhes com opcoes |

---

## NOTIFICACOES IN-APP

### TC-NOT-015: Notificacao com App em Foreground
**Prioridade:** P0
**Pre-condicoes:** App aberto e em uso

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Evento dispara notificacao | Servidor envia |
| 2 | Push NAO aparece no sistema | Correto |
| 3 | In-app notification | Banner no topo do app |
| 4 | Som/vibracao | Configura conforme preferencias |
| 5 | Tocar no banner | Navega para destino |
| 6 | Deslizar para fechar | Banner some |

---

### TC-NOT-016: Badge de Notificacoes
**Prioridade:** P1
**Pre-condicoes:** Notificacoes nao lidas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber 3 notificacoes | Badge mostra "3" |
| 2 | Abrir lista de notificacoes | Todas exibidas |
| 3 | Marcar como lida | Badge atualiza |
| 4 | Ler todas | Badge some |

---

### TC-NOT-017: Central de Notificacoes
**Prioridade:** P1
**Pre-condicoes:** Usuario com historico

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Notificacoes" | Lista exibida |
| 2 | Ver notificacoes recentes | Ordenadas por data |
| 3 | Notificacoes nao lidas | Destacadas |
| 4 | Tocar em uma | Navega + marca como lida |
| 5 | Limpar todas | Opcao disponivel |

---

## CENARIOS DE ESTADO DO APP

### TC-NOT-018: Push com App em Background
**Prioridade:** P0
**Pre-condicoes:** App minimizado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | App em background | Ainda registrado |
| 2 | Evento dispara push | Push enviado |
| 3 | Notificacao aparece | Na bandeja do sistema |
| 4 | Som/vibracao | Conforme config do sistema |
| 5 | Tocar | App volta ao foreground |
| 6 | Deep link | Navega para tela correta |

---

### TC-NOT-019: Push com App Fechado (Killed)
**Prioridade:** P0
**Pre-condicoes:** App completamente fechado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Forcar fechamento do app | App fechado |
| 2 | Evento dispara push | Push enviado |
| 3 | Notificacao aparece | Na bandeja |
| 4 | Tocar | App inicia |
| 5 | Deep link | Navega apos login (se necessario) |

---

### TC-NOT-020: Push com Tela Bloqueada
**Prioridade:** P1
**Pre-condicoes:** Dispositivo bloqueado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tela bloqueada | Dispositivo em standby |
| 2 | Evento dispara push | Push enviado |
| 3 | Tela acende | Notificacao visivel |
| 4 | Preview | Texto visivel (ou oculto se config) |
| 5 | Desbloquear e tocar | Abre app na tela correta |

---

## DEEP LINKING

### TC-NOT-021: Deep Link para Pedido
**Prioridade:** P0
**Pre-condicoes:** Push com orderId

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber push de pedido | Notificacao aparece |
| 2 | Tocar | App abre |
| 3 | Navegar | Direto para detalhes do pedido |
| 4 | Pedido nao existe mais | Mensagem amigavel |

---

### TC-NOT-022: Deep Link para Chat
**Prioridade:** P1
**Pre-condicoes:** Push de mensagem

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber push de chat | Notificacao aparece |
| 2 | Tocar | App abre |
| 3 | Navegar | Direto para conversa |

---

### TC-NOT-023: Deep Link com Usuario Deslogado
**Prioridade:** P1
**Pre-condicoes:** Usuario fez logout

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber push | Notificacao aparece |
| 2 | Tocar | App abre em login |
| 3 | Fazer login | Redireciona para destino |
| 4 | Ou | Perde deep link (comportamento aceitavel) |

---

## CONFIGURACOES DE NOTIFICACAO

### TC-NOT-024: Desativar Notificacoes Especificas
**Prioridade:** P1
**Pre-condicoes:** Usuario logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Configuracoes" | Tela de config |
| 2 | Ver opcoes de notificacao | Lista de tipos |
| 3 | Desativar "Promocoes" | Toggle off |
| 4 | Salvar | Preferencia salva |
| 5 | Enviar push promocional | NAO deve chegar |

**Tipos configuráveis:**
- [ ] Novos pedidos (motorista)
- [ ] Atualizacoes de entrega
- [ ] Mensagens
- [ ] Promocoes
- [ ] Lembretes
- [ ] Documentos

---

### TC-NOT-025: Som de Notificacao Personalizado
**Prioridade:** P2
**Pre-condicoes:** App com sons customizados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber push de pedido | Som especial |
| 2 | Receber push de mensagem | Som padrao |
| 3 | Receber push de promo | Sem som ou som diferente |

---

## CENARIOS DE ERRO

### TC-NOT-026: Token Invalido
**Prioridade:** P1
**Pre-condicoes:** Token expirado ou invalido

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Servidor tenta enviar push | Erro de token |
| 2 | Servidor marca token invalido | Token removido |
| 3 | App abre | Gera novo token |
| 4 | Novo token registrado | Notificacoes voltam |

---

### TC-NOT-027: Notificacao Atrasada
**Prioridade:** P1
**Pre-condicoes:** Dispositivo estava offline

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Dispositivo fica offline | Push enfileirado |
| 2 | Dispositivo volta online | Push entregue |
| 3 | TTL expirado | Push descartado |

---

### TC-NOT-028: Multiplas Notificacoes Simultaneas
**Prioridade:** P1
**Pre-condicoes:** Varios eventos ao mesmo tempo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | 5 eventos simultaneos | 5 pushes enviados |
| 2 | Verificar | Todas chegam |
| 3 | Verificar agrupamento | Android agrupa, iOS mostra separado |
| 4 | Tocar em uma | Navega corretamente |

---

## PLATAFORMAS ESPECIFICAS

### TC-NOT-029: iOS - Provisional Push (iOS 12+)
**Prioridade:** P2
**Pre-condicoes:** iOS 12+, permissao nao solicitada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Enviar push provisional | Chega silenciosamente |
| 2 | Aparece em "Notificacoes silenciosas" | Central de notificacoes |
| 3 | Usuario escolhe manter | Ativa notificacoes normais |

---

### TC-NOT-030: Android - Canais de Notificacao (Android 8+)
**Prioridade:** P1
**Pre-condicoes:** Android 8+

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Verificar canais | Criados na instalacao |
| 2 | Canal "Pedidos" | Prioridade alta, som especial |
| 3 | Canal "Mensagens" | Prioridade normal |
| 4 | Canal "Promocoes" | Prioridade baixa |
| 5 | Usuario pode silenciar canal | Via config do sistema |

---

## CHECKLIST DE REGRESSAO - NOTIFICACOES

### Permissoes
- [ ] Solicitar permissao (primeira vez)
- [ ] Permissao negada
- [ ] Registro de token

### Push Motorista
- [ ] Novo pedido
- [ ] Pedido cancelado
- [ ] Nova mensagem
- [ ] Lembrete de viagem
- [ ] Documento vencendo

### Push Cliente
- [ ] Motorista aceitou
- [ ] Motorista a caminho
- [ ] Mercadoria coletada
- [ ] Motorista chegou
- [ ] Entrega realizada
- [ ] Pedido cancelado

### Estados do App
- [ ] App em foreground (in-app)
- [ ] App em background
- [ ] App fechado
- [ ] Tela bloqueada

### Deep Linking
- [ ] Deep link para pedido
- [ ] Deep link para chat
- [ ] Deep link com usuario deslogado

### Configuracoes
- [ ] Desativar tipo especifico
- [ ] Som personalizado
- [ ] Badge atualiza

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| NOT-001 | Deep link nao funciona em iOS cold start | Investigando | 1.2.0 |
| NOT-002 | Badge nao reseta ao ler todas | Aberto | 1.2.0 |
| NOT-003 | Push duplicado em Android | Corrigido | 1.1.7 |
| NOT-004 | Som de pedido nao toca em modo silencioso | Esperado | - |

---

## NOTAS DO QA

1. **Testar ambas plataformas:** iOS e Android tem comportamentos diferentes
2. **Testar todos estados:** Foreground, background, killed, locked
3. **Testar deep links:** Especialmente com app fechado
4. **Verificar sons:** Diferentes sons para diferentes tipos
5. **Testar offline:** Push quando volta online
6. **Verificar payload:** Dados corretos na notificacao
