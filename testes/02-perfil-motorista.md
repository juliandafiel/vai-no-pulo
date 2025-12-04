# Plano de Testes - Perfil do Motorista

## Objetivo
Validar todas as funcionalidades relacionadas ao perfil do motorista: visualizacao, edicao, status, documentos e configuracoes.

---

## VISUALIZACAO DE PERFIL

### TC-PERF-001: Visualizar Perfil Completo
**Prioridade:** P0
**Pre-condicoes:** Motorista logado com perfil completo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Perfil" no menu | Tela de perfil abre |
| 2 | Verificar foto | Foto exibida ou placeholder |
| 3 | Verificar nome | Nome completo exibido |
| 4 | Verificar email | Email exibido (parcialmente oculto?) |
| 5 | Verificar telefone | Telefone exibido |
| 6 | Verificar status | Badge de status (Ativo/Pendente/etc) |
| 7 | Verificar avaliacao | Estrelas e numero de avaliacoes |

---

### TC-PERF-002: Visualizar Dados do Veiculo
**Prioridade:** P0
**Pre-condicoes:** Motorista com veiculo cadastrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar secao "Meu Veiculo" | Dados do veiculo exibidos |
| 2 | Verificar marca/modelo | Exibido corretamente |
| 3 | Verificar placa | Placa formatada (ABC-1234) |
| 4 | Verificar ano | Ano do veiculo |
| 5 | Verificar foto | Foto do veiculo |
| 6 | Verificar status | Status de aprovacao |

---

### TC-PERF-003: Visualizar Documentos
**Prioridade:** P1
**Pre-condicoes:** Motorista com documentos enviados

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar secao "Documentos" | Lista de documentos |
| 2 | Ver CNH | Status: Aprovado/Pendente/Rejeitado |
| 3 | Ver CRLV | Status do documento |
| 4 | Ver data de validade | Destaque se proximo de vencer |
| 5 | Tocar em documento | Preview ampliado |

---

## EDICAO DE PERFIL

### TC-PERF-004: Editar Nome
**Prioridade:** P1
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Editar" | Modo de edicao ativo |
| 2 | Alterar nome | Campo editavel |
| 3 | Salvar | Confirmacao de alteracao |
| 4 | Verificar | Nome atualizado |

**Validacoes:**
- [ ] Nome nao pode ser vazio
- [ ] Minimo 3 caracteres
- [ ] Nao pode conter numeros
- [ ] Nao pode conter caracteres especiais (exceto acentos)

---

### TC-PERF-005: Editar Telefone
**Prioridade:** P1
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em telefone | Campo editavel |
| 2 | Alterar numero | Mascara aplicada |
| 3 | Salvar | Verificacao pode ser necessaria |
| 4 | Verificar | Numero atualizado |

---

### TC-PERF-006: Alterar Foto de Perfil
**Prioridade:** P1
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar na foto de perfil | Opcoes: Camera ou Galeria |
| 2 | Escolher "Tirar foto" | Camera abre |
| 3 | Capturar foto | Preview exibido |
| 4 | Recortar (crop circular) | Editor de crop |
| 5 | Confirmar | Upload inicia |
| 6 | Verificar | Nova foto exibida |

---

### TC-PERF-007: Alterar Senha
**Prioridade:** P0
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Seguranca" | Opcoes de seguranca |
| 2 | Tocar em "Alterar senha" | Formulario abre |
| 3 | Inserir senha atual | Campo de senha |
| 4 | Inserir nova senha | Validacao de forca |
| 5 | Confirmar nova senha | Deve coincidir |
| 6 | Salvar | Senha alterada |
| 7 | Proximo login | Usar nova senha |

---

## STATUS DO MOTORISTA

### TC-PERF-008: Toggle Online/Offline
**Prioridade:** P0
**Pre-condicoes:** Motorista aprovado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ver status atual | "Offline" ou "Online" |
| 2 | Ativar toggle "Ficar Online" | Status muda para Online |
| 3 | Verificar localizacao | GPS ativo |
| 4 | Verificar visibilidade | Aparece para clientes |
| 5 | Desativar toggle | Status volta para Offline |
| 6 | Verificar | Nao recebe novos pedidos |

---

### TC-PERF-009: Status Pendente (Aguardando Aprovacao)
**Prioridade:** P0
**Pre-condicoes:** Motorista recem cadastrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar perfil | Status: "Pendente" |
| 2 | Ver mensagem | "Aguardando aprovacao" |
| 3 | Funcionalidades bloqueadas | Nao pode ficar online |
| 4 | Toggle indisponivel | Desabilitado com explicacao |
| 5 | Admin aprova | Notificacao recebida |
| 6 | Status atualiza | "Aprovado" - pode trabalhar |

---

### TC-PERF-010: Status Suspenso
**Prioridade:** P1
**Pre-condicoes:** Motorista com suspensao

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar app | Tela de suspensao |
| 2 | Ver motivo | Razao da suspensao |
| 3 | Ver prazo | Data de fim da suspensao |
| 4 | Tentar ficar online | Bloqueado |
| 5 | Opcao de recurso | "Contestar suspensao" |

---

## DOCUMENTOS

### TC-PERF-011: Enviar CNH
**Prioridade:** P0
**Pre-condicoes:** Motorista sem CNH cadastrada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Documentos" | Lista de documentos |
| 2 | Tocar em "CNH" | Opcao de upload |
| 3 | Tirar foto da frente | Camera com guia |
| 4 | Tirar foto do verso | Camera com guia |
| 5 | Inserir validade | Date picker |
| 6 | Enviar | Upload das imagens |
| 7 | Verificar status | "Em analise" |

---

### TC-PERF-012: CNH Vencida
**Prioridade:** P0
**Pre-condicoes:** CNH com data de validade passada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar perfil | Alerta de CNH vencida |
| 2 | Verificar status | "Documento vencido" em vermelho |
| 3 | Tentar ficar online | Bloqueado |
| 4 | Opcao | "Atualizar CNH" |
| 5 | Enviar nova CNH | Processo de atualizacao |

---

### TC-PERF-013: CNH Proxima do Vencimento
**Prioridade:** P1
**Pre-condicoes:** CNH vence em menos de 30 dias

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar perfil | Aviso amarelo |
| 2 | Ver mensagem | "CNH vence em X dias" |
| 3 | Pode continuar trabalhando | Sim, ate vencer |
| 4 | Lembrete | Notificacao enviada |

---

### TC-PERF-014: CRLV do Veiculo
**Prioridade:** P0
**Pre-condicoes:** Motorista com veiculo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar documentos do veiculo | Lista exibida |
| 2 | Tocar em "CRLV" | Opcao de upload |
| 3 | Tirar foto | Camera abre |
| 4 | Inserir ano de exercicio | Ano do CRLV |
| 5 | Enviar | Upload concluido |
| 6 | Status | "Em analise" |

---

### TC-PERF-015: Documento Rejeitado
**Prioridade:** P0
**Pre-condicoes:** Documento enviado e rejeitado pelo admin

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber notificacao | "Documento rejeitado" |
| 2 | Ver motivo | Razao da rejeicao |
| 3 | Opcao disponivel | "Reenviar documento" |
| 4 | Reenviar | Novo upload |
| 5 | Status | "Em analise" novamente |

---

## ESTATISTICAS E METRICAS

### TC-PERF-016: Visualizar Estatisticas
**Prioridade:** P1
**Pre-condicoes:** Motorista com historico

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Estatisticas" | Dashboard de metricas |
| 2 | Ver entregas do mes | Numero total |
| 3 | Ver km rodados | Distancia total |
| 4 | Ver ganhos | Valor total (se aplicavel) |
| 5 | Ver avaliacao media | Estrelas |

---

### TC-PERF-017: Historico de Avaliacoes
**Prioridade:** P1
**Pre-condicoes:** Motorista com avaliacoes recebidas

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Avaliacoes" | Lista de avaliacoes |
| 2 | Ver avaliacao recente | Data, nota, comentario |
| 3 | Ver media geral | Estrelas (ex: 4.8) |
| 4 | Filtrar por periodo | Funciona |
| 5 | Ver feedback negativo | Se houver |

---

## CONFIGURACOES

### TC-PERF-018: Configuracoes de Notificacao
**Prioridade:** P1
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Configuracoes" | Tela de config |
| 2 | Ver opcoes de notificacao | Lista de toggles |
| 3 | Desativar "Novos pedidos" | Toggle off |
| 4 | Salvar | Configuracao salva |
| 5 | Verificar | Nao recebe push de pedidos |

**Opcoes de notificacao:**
- [ ] Novos pedidos
- [ ] Atualizacoes de entrega
- [ ] Mensagens de clientes
- [ ] Promocoes e novidades
- [ ] Lembretes

---

### TC-PERF-019: Configuracoes de Privacidade
**Prioridade:** P2
**Pre-condicoes:** Motorista logado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Privacidade" | Opcoes de privacidade |
| 2 | Ver "Compartilhar localizacao" | Explicacao clara |
| 3 | Ver "Dados de uso" | Opcao de opt-out |
| 4 | Solicitar exclusao de dados | Processo disponivel |

---

### TC-PERF-020: Preferencias de Trabalho
**Prioridade:** P1
**Pre-condicoes:** Motorista aprovado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Preferencias" | Opcoes de trabalho |
| 2 | Definir raio de atuacao | Ex: 20km do ponto inicial |
| 3 | Definir tipos de entrega | Ex: apenas pequenos volumes |
| 4 | Definir horarios | Ex: apenas dias uteis |
| 5 | Salvar | Preferencias aplicadas |

---

## EXCLUSAO DE CONTA

### TC-PERF-021: Solicitar Exclusao de Conta
**Prioridade:** P1
**Pre-condicoes:** Motorista sem entregas pendentes

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Conta" | Opcoes da conta |
| 2 | Tocar em "Excluir conta" | Aviso de consequencias |
| 3 | Confirmar intencao | "Tem certeza?" |
| 4 | Inserir senha | Confirmacao de identidade |
| 5 | Confirmar exclusao | Conta marcada para exclusao |
| 6 | Prazo de carencia | 30 dias para reverter |
| 7 | Apos 30 dias | Dados excluidos |

---

### TC-PERF-022: Cancelar Exclusao
**Prioridade:** P2
**Pre-condicoes:** Conta em processo de exclusao

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Fazer login | Aviso de exclusao pendente |
| 2 | Opcao "Cancelar exclusao" | Disponivel |
| 3 | Confirmar | Exclusao cancelada |
| 4 | Conta restaurada | Funcionando normalmente |

---

## CHECKLIST DE REGRESSAO - PERFIL

### Visualizacao
- [ ] Perfil completo exibido
- [ ] Dados do veiculo
- [ ] Documentos
- [ ] Status correto
- [ ] Avaliacao

### Edicao
- [ ] Editar nome
- [ ] Editar telefone
- [ ] Alterar foto
- [ ] Alterar senha

### Status
- [ ] Toggle online/offline
- [ ] Status pendente
- [ ] Status suspenso
- [ ] Status aprovado

### Documentos
- [ ] Upload de CNH
- [ ] Upload de CRLV
- [ ] CNH vencida
- [ ] Documento rejeitado
- [ ] Reenvio de documento

### Configuracoes
- [ ] Notificacoes
- [ ] Privacidade
- [ ] Preferencias de trabalho

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| PERF-001 | Foto de perfil nao atualiza imediatamente | Investigando | 1.2.0 |
| PERF-002 | Status demora a sincronizar | Aberto | 1.2.0 |
| PERF-003 | Estatisticas mostram valores errados no inicio do mes | Corrigido | 1.1.8 |

---

## NOTAS DO QA

1. **Offline:** Perfil deve carregar do cache quando offline
2. **Sincronizacao:** Alteracoes devem sincronizar quando online
3. **Validacao de documentos:** Testar com documentos ilegíveis
4. **Performance:** Carregar perfil deve ser <2s
5. **Cache de imagens:** Fotos devem estar em cache local
