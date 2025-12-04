# Checklist de Regressao - Vai no Pulo

## Objetivo
Checklist consolidado para execucao de testes de regressao antes de cada release.

---

## INSTRUCOES

- Executar antes de cada release para producao
- Marcar com [x] os itens testados e aprovados
- Marcar com [!] itens com problemas encontrados
- Registrar bugs em sistema de tracking
- Tempo estimado: 4-6 horas para regressao completa

---

## 1. AUTENTICACAO E ACESSO

### Login
- [ ] Login com credenciais validas (cliente)
- [ ] Login com credenciais validas (motorista)
- [ ] Login com email incorreto
- [ ] Login com senha incorreta
- [ ] Bloqueio apos 5 tentativas
- [ ] Mostrar/ocultar senha
- [ ] "Esqueci minha senha" funciona

### Registro
- [ ] Registro de novo cliente
- [ ] Registro de novo motorista
- [ ] Validacao de email duplicado
- [ ] Validacao de CPF (motorista)
- [ ] Validacao de senha forte
- [ ] Email de verificacao enviado

### Sessao
- [ ] Token persistido apos fechar app
- [ ] Logout funciona corretamente
- [ ] Sessao expira conforme configurado
- [ ] Refresh token funciona

---

## 2. PERFIL E DOCUMENTOS

### Perfil do Usuario
- [ ] Visualizar dados do perfil
- [ ] Editar nome
- [ ] Editar telefone
- [ ] Alterar foto de perfil
- [ ] Alterar senha

### Perfil do Motorista
- [ ] Toggle online/offline
- [ ] Status correto (Pendente/Aprovado/Suspenso)
- [ ] Visualizar estatisticas
- [ ] Visualizar avaliacoes

### Documentos
- [ ] Upload de CNH (frente e verso)
- [ ] Upload de CRLV
- [ ] Aviso de documento vencendo
- [ ] Documento rejeitado - reenvio

---

## 3. VEICULO

### Cadastro
- [ ] Cadastrar novo veiculo
- [ ] Validacao de placa (formato antigo)
- [ ] Validacao de placa (Mercosul)
- [ ] Upload de foto do veiculo
- [ ] Upload de CRLV do veiculo

### Aprovacao
- [ ] Veiculo aprovado (notificacao + email)
- [ ] Veiculo rejeitado (notificacao + email)
- [ ] Mensagem personalizada do admin
- [ ] Corrigir e reenviar veiculo

### Edicao
- [ ] Editar cor do veiculo
- [ ] Atualizar foto
- [ ] Atualizar CRLV anual

---

## 4. GPS E LOCALIZACAO

### Permissoes
- [ ] Solicitar permissao de localizacao
- [ ] Funcionar com "Apenas durante uso"
- [ ] Funcionar com "Sempre permitir"
- [ ] Mensagem quando negado

### Tracking
- [ ] Localizacao precisa (<10m)
- [ ] Atualizacao em tempo real
- [ ] Tracking em background
- [ ] Tracking com tela bloqueada

### Mapa
- [ ] Mapa carrega corretamente
- [ ] Marcadores exibidos
- [ ] Rota tracada
- [ ] Navegacao funciona

---

## 5. PEDIDOS E ENTREGAS

### Criacao (Cliente)
- [ ] Criar pedido simples
- [ ] Autocomplete de endereco
- [ ] Estimativa de preco
- [ ] Selecao de tipo de volume
- [ ] Agendamento de pedido

### Aceite (Motorista)
- [ ] Visualizar pedidos disponiveis
- [ ] Aceitar pedido
- [ ] Recusar pedido
- [ ] Timeout de aceite

### Coleta
- [ ] Navegar ate coleta
- [ ] Confirmar chegada
- [ ] Confirmar coleta
- [ ] Reportar problema

### Entrega
- [ ] Navegar ate destino
- [ ] Confirmar chegada
- [ ] Coletar assinatura/codigo
- [ ] Tirar foto de comprovante
- [ ] Confirmar entrega
- [ ] Destinatario ausente

### Tracking
- [ ] Cliente ve localizacao do motorista
- [ ] Atualizacao em tempo real
- [ ] ETA atualiza
- [ ] Status do pedido correto

---

## 6. VIAGENS E ROTAS

### Criacao de Viagem
- [ ] Criar viagem simples
- [ ] Criar viagem com paradas
- [ ] Validacao de data/hora

### Calculo de Rota
- [ ] Rota calculada corretamente
- [ ] Tempo estimado razoavel
- [ ] Distancia calculada
- [ ] Pedagios identificados

### Rotas Longas
- [ ] Rota >100km funciona
- [ ] Tracking por 4+ horas
- [ ] Desvio de rota recalcula
- [ ] Paradas detectadas

---

## 7. CAMERA E UPLOAD

### Camera
- [ ] Permissao de camera
- [ ] Capturar foto do veiculo
- [ ] Capturar documento
- [ ] Flash funciona
- [ ] Camera frontal/traseira

### Galeria
- [ ] Permissao de galeria
- [ ] Selecionar da galeria
- [ ] Crop funciona

### Upload
- [ ] Upload com progresso
- [ ] Upload completa
- [ ] Retry apos falha
- [ ] Imagem exibida apos upload

---

## 8. CONECTIVIDADE

### Offline
- [ ] Detecta perda de conexao
- [ ] Banner "Sem conexao" aparece
- [ ] Dados em cache acessiveis
- [ ] Fila de acoes offline

### Reconexao
- [ ] Reconecta automaticamente
- [ ] Sincroniza dados pendentes
- [ ] WebSocket reconecta

### Rede Lenta
- [ ] Loading visivel
- [ ] Timeout com mensagem
- [ ] Retry funciona

---

## 9. NOTIFICACOES

### Push
- [ ] Push com app fechado
- [ ] Push com app em background
- [ ] Push com app em foreground (in-app)
- [ ] Deep link funciona

### Tipos de Notificacao
- [ ] Novo pedido (motorista)
- [ ] Motorista aceitou (cliente)
- [ ] Mercadoria coletada
- [ ] Entrega realizada
- [ ] Pedido cancelado

---

## 10. CANCELAMENTOS

### Motorista
- [ ] Cancelar antes de iniciar
- [ ] Cancelar durante viagem
- [ ] Motivo obrigatorio

### Cliente
- [ ] Cancelar antes da coleta
- [ ] Cancelar apos coleta (taxa)
- [ ] Reembolso processado

### Notificacoes
- [ ] Cliente notificado
- [ ] Motorista notificado

---

## 11. BACKGROUND TASKS

### Tracking
- [ ] Funciona com app minimizado
- [ ] Funciona com tela bloqueada
- [ ] Retoma apos sistema matar app

### Sincronizacao
- [ ] Sync periodico funciona
- [ ] Sync apos reconexao

### Upload
- [ ] Continua em background
- [ ] Retoma apos interrupcao

---

## 12. PERFORMANCE

### Tempo de Carregamento
- [ ] Cold start <3s
- [ ] Dashboard <2s
- [ ] Lista de pedidos <2s

### Recursos
- [ ] Sem memory leaks
- [ ] Bateria aceitavel (8h <70%)

---

## 13. SEGURANCA

### Autenticacao
- [ ] Brute force bloqueado
- [ ] Token invalidado no logout

### Autorizacao
- [ ] Nao acessa dados de outro usuario
- [ ] Roles funcionando

### Dados
- [ ] HTTPS em todas requisicoes
- [ ] Sem dados sensiveis em logs

---

## 14. ADMIN PANEL

### Usuarios
- [ ] Listar usuarios
- [ ] Ver detalhes
- [ ] Editar usuario
- [ ] Bloquear/desbloquear

### Veiculos
- [ ] Listar veiculos pendentes
- [ ] Aprovar veiculo
- [ ] Rejeitar veiculo (com motivo)
- [ ] Ver imagem do veiculo

### Pedidos
- [ ] Listar pedidos
- [ ] Ver detalhes
- [ ] Filtrar por status

---

## RESULTADO DA REGRESSAO

| Categoria | Total | Passou | Falhou | Bloqueado |
|-----------|-------|--------|--------|-----------|
| Autenticacao | 15 | | | |
| Perfil | 12 | | | |
| Veiculo | 13 | | | |
| GPS | 10 | | | |
| Pedidos | 25 | | | |
| Viagens | 10 | | | |
| Camera | 12 | | | |
| Conectividade | 10 | | | |
| Notificacoes | 10 | | | |
| Cancelamentos | 8 | | | |
| Background | 8 | | | |
| Performance | 5 | | | |
| Seguranca | 6 | | | |
| Admin | 10 | | | |
| **TOTAL** | **144** | | | |

---

## BUGS ENCONTRADOS

| # | Descricao | Severidade | Status |
|---|-----------|------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Severidade:**
- P0: Blocker - Impede release
- P1: Critico - Deve ser corrigido antes do release
- P2: Major - Pode ir com workaround
- P3: Minor - Pode aguardar proximo release

---

## APROVACAO

| Item | Responsavel | Data | Assinatura |
|------|-------------|------|------------|
| QA Executou | | | |
| QA Lead Revisou | | | |
| Dev Lead Aprovou | | | |
| PM Autorizou Release | | | |

---

## NOTAS

1. **Dispositivos testados:**
   - iOS:
   - Android:

2. **Versao testada:**
   - App:
   - Backend:

3. **Ambiente:**
   - [ ] Staging
   - [ ] Production

4. **Observacoes:**



---

## HISTORICO DE REGRESSOES

| Data | Versao | Resultado | Responsavel |
|------|--------|-----------|-------------|
| | | | |
| | | | |
| | | | |
