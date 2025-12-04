# Plano de Testes - Cadastro e Gerenciamento de Veiculo

## Objetivo
Validar o cadastro, edicao, aprovacao e gerenciamento de veiculos dos motoristas.

---

## CADASTRO DE VEICULO

### TC-VEI-001: Cadastro de Veiculo Novo - Fluxo Completo
**Prioridade:** P0
**Pre-condicoes:** Motorista logado sem veiculo cadastrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Meu Veiculo" | Tela de cadastro exibida |
| 2 | Selecionar tipo de veiculo | Moto, Carro, Van, Caminhao |
| 3 | Inserir marca | Campo de texto ou select |
| 4 | Inserir modelo | Campo de texto ou select |
| 5 | Inserir ano | Ano de fabricacao |
| 6 | Inserir placa | Formato ABC-1234 ou ABC1D23 |
| 7 | Inserir cor | Select de cores |
| 8 | Tirar foto do veiculo | Camera abre |
| 9 | Enviar CRLV | Upload de documento |
| 10 | Confirmar | Veiculo cadastrado |
| 11 | Status | "Aguardando aprovacao" |

---

### TC-VEI-002: Validacao de Placa - Formato Antigo
**Prioridade:** P0
**Pre-condicoes:** Campo de placa

| Placa | Resultado |
|-------|-----------|
| ABC-1234 | Valida |
| ABC1234 | Valida (adiciona hifen) |
| abc-1234 | Valida (converte maiusculo) |
| AB-1234 | Invalida (3 letras necessarias) |
| ABCD-123 | Invalida (formato errado) |
| ABC-12345 | Invalida (5 numeros) |

---

### TC-VEI-003: Validacao de Placa - Formato Mercosul
**Prioridade:** P0
**Pre-condicoes:** Campo de placa

| Placa | Resultado |
|-------|-----------|
| ABC1D23 | Valida |
| ABC1234 | Valida (formato antigo) |
| ABC1DE3 | Invalida |
| AB1C234 | Invalida |

---

### TC-VEI-004: Validacao de Ano do Veiculo
**Prioridade:** P1
**Pre-condicoes:** Campo de ano

| Ano | Resultado |
|-----|-----------|
| 2024 | Valido |
| 2015 | Valido |
| 2000 | Valido (verificar limite minimo) |
| 1990 | Pode ser invalido (muito antigo) |
| 2025 | Invalido (futuro) se estamos em 2024 |
| 1899 | Invalido |

**Regra de negocio:** Verificar idade maxima permitida do veiculo

---

### TC-VEI-005: Tipos de Veiculo e Capacidade
**Prioridade:** P1
**Pre-condicoes:** Selecao de tipo

| Tipo | Capacidade Padrao | Peso Maximo |
|------|-------------------|-------------|
| Moto | Ate 10kg | Volumes pequenos |
| Carro | Ate 50kg | Volumes medios |
| Van | Ate 200kg | Volumes grandes |
| Caminhao | Ate 1000kg+ | Cargas |

---

### TC-VEI-006: Foto do Veiculo - Requisitos
**Prioridade:** P0
**Pre-condicoes:** Camera aberta para foto

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Exibir instrucoes | "Foto deve mostrar placa" |
| 2 | Tirar foto borrada | Aviso: "Foto pouco nitida" |
| 3 | Foto muito escura | Aviso: "Iluminacao insuficiente" |
| 4 | Foto sem placa visivel | Aviso: "Placa nao identificada" |
| 5 | Foto adequada | Aceita |

**Requisitos:**
- [ ] Resolucao minima: 1280x720
- [ ] Placa legivel
- [ ] Veiculo inteiro visivel
- [ ] Iluminacao adequada

---

### TC-VEI-007: Upload de CRLV
**Prioridade:** P0
**Pre-condicoes:** Documento disponivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Enviar CRLV" | Opcoes: Camera ou Galeria |
| 2 | Escolher camera | Camera com guia |
| 3 | Posicionar documento | Deteccao automatica |
| 4 | Capturar | Foto processada |
| 5 | Corrigir perspectiva | Documento alinhado |
| 6 | Verificar legibilidade | Texto legivel |
| 7 | Confirmar | Upload realizado |

---

## APROVACAO DE VEICULO

### TC-VEI-008: Veiculo Aprovado
**Prioridade:** P0
**Pre-condicoes:** Veiculo cadastrado, aguardando aprovacao

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Admin analisa veiculo | Verifica dados e documentos |
| 2 | Admin aprova | Altera status para "Aprovado" |
| 3 | Motorista recebe notificacao | Push: "Veiculo aprovado!" |
| 4 | Motorista recebe email | Email com detalhes |
| 5 | Status no app | "Aprovado" (verde) |
| 6 | Funcionalidades | Pode ficar online |

---

### TC-VEI-009: Veiculo Rejeitado
**Prioridade:** P0
**Pre-condicoes:** Veiculo cadastrado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Admin analisa | Problema identificado |
| 2 | Admin rejeita com motivo | "Placa ilegivel na foto" |
| 3 | Motorista recebe notificacao | Push: "Veiculo nao aprovado" |
| 4 | Motorista recebe email | Email com motivo |
| 5 | Ver motivo no app | Exibido claramente |
| 6 | Opcao de corrigir | "Reenviar informacoes" |

**Motivos comuns de rejeicao:**
- [ ] Foto do veiculo inadequada
- [ ] Placa nao legivel
- [ ] CRLV ilegivel
- [ ] CRLV vencido
- [ ] Dados inconsistentes
- [ ] Veiculo muito antigo

---

### TC-VEI-010: Corrigir e Reenviar Veiculo Rejeitado
**Prioridade:** P0
**Pre-condicoes:** Veiculo rejeitado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ver motivo da rejeicao | Claro e especifico |
| 2 | Tocar em "Corrigir" | Campos editaveis |
| 3 | Atualizar campo com problema | Nova foto/documento |
| 4 | Reenviar | Solicitacao enviada |
| 5 | Status | "Aguardando revisao" |
| 6 | Nova analise | Admin analisa novamente |

---

## EDICAO DE VEICULO

### TC-VEI-011: Editar Dados do Veiculo
**Prioridade:** P1
**Pre-condicoes:** Veiculo aprovado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Meu Veiculo" | Dados exibidos |
| 2 | Tocar em "Editar" | Modo de edicao |
| 3 | Alterar cor | Disponivel |
| 4 | Tentar alterar placa | Bloqueado (solicitar nova analise) |
| 5 | Salvar | Alteracao salva |

**Campos editaveis sem nova analise:**
- [x] Cor
- [x] Foto (pode necessitar nova analise)

**Campos que requerem nova analise:**
- [ ] Placa
- [ ] Tipo de veiculo
- [ ] CRLV

---

### TC-VEI-012: Atualizar Foto do Veiculo
**Prioridade:** P1
**Pre-condicoes:** Veiculo aprovado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar na foto | Opcoes: Visualizar / Alterar |
| 2 | Escolher "Alterar" | Camera ou Galeria |
| 3 | Tirar nova foto | Foto capturada |
| 4 | Confirmar | Upload iniciado |
| 5 | Verificar | Pode precisar nova aprovacao |

---

### TC-VEI-013: Atualizar CRLV Anual
**Prioridade:** P0
**Pre-condicoes:** CRLV proximo de vencer ou vencido

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Receber lembrete | "CRLV vence em 30 dias" |
| 2 | Acessar documentos | Lista de documentos |
| 3 | Tocar em CRLV | Opcao "Atualizar" |
| 4 | Enviar novo documento | Upload |
| 5 | Aguardar aprovacao | Status "Em analise" |
| 6 | Aprovado | Novo CRLV ativo |

---

## TROCA DE VEICULO

### TC-VEI-014: Cadastrar Novo Veiculo (Substituicao)
**Prioridade:** P1
**Pre-condicoes:** Motorista com veiculo aprovado

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Meu Veiculo" | Veiculo atual exibido |
| 2 | Tocar em "Trocar veiculo" | Confirmacao necessaria |
| 3 | Confirmar | Formulario de novo veiculo |
| 4 | Preencher dados | Mesmo fluxo de cadastro |
| 5 | Enviar | Novo veiculo em analise |
| 6 | Status | Veiculo antigo inativo ate aprovacao |

---

### TC-VEI-015: Veiculo Antigo Durante Analise
**Prioridade:** P1
**Pre-condicoes:** Troca de veiculo em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Solicitar troca | Novo veiculo em analise |
| 2 | Verificar status | "Veiculo anterior ativo ate aprovacao" |
| 3 | Pode trabalhar | Sim, com veiculo antigo |
| 4 | Novo aprovado | Troca automatica |
| 5 | Veiculo antigo | Arquivado |

---

## VALIDACOES ESPECIAIS

### TC-VEI-016: Placa Duplicada
**Prioridade:** P0
**Pre-condicoes:** Placa ja cadastrada por outro motorista

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tentar cadastrar placa existente | Erro detectado |
| 2 | Mensagem | "Esta placa ja esta cadastrada" |
| 3 | Opcoes | "Se o veiculo e seu, contate suporte" |

---

### TC-VEI-017: Veiculo em Lista de Restricao
**Prioridade:** P1
**Pre-condicoes:** Placa com pendencias (consulta externa)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Cadastrar placa | Consulta automatica |
| 2 | Placa com restricao | Aviso exibido |
| 3 | Bloquear cadastro | Nao permitido |
| 4 | Orientacao | "Regularize o veiculo" |

---

### TC-VEI-018: Tipos de Veiculo Especiais
**Prioridade:** P2
**Pre-condicoes:** Veiculo com caracteristicas especiais

| Tipo | Validacao Extra |
|------|-----------------|
| Refrigerado | Certificado de refrigeracao |
| Baú fechado | Foto interna |
| Moto com bau | Foto do bau |
| Veiculo adaptado | Documentacao especial |

---

## VISUALIZACAO E HISTORICO

### TC-VEI-019: Historico de Veiculos
**Prioridade:** P2
**Pre-condicoes:** Motorista que ja trocou de veiculo

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Acessar "Historico de veiculos" | Lista de veiculos |
| 2 | Ver veiculo atual | Destacado |
| 3 | Ver veiculos anteriores | Lista com datas |
| 4 | Tocar em antigo | Detalhes exibidos |

---

### TC-VEI-020: Status do Veiculo no Perfil
**Prioridade:** P1
**Pre-condicoes:** Motorista com veiculo

| Status | Cor | Acao Disponivel |
|--------|-----|-----------------|
| Pendente | Amarelo | Aguardar |
| Em Analise | Azul | Aguardar |
| Aprovado | Verde | Pode trabalhar |
| Rejeitado | Vermelho | Corrigir e reenviar |
| Suspenso | Vermelho | Contatar suporte |
| Doc. Vencido | Laranja | Atualizar documento |

---

## CHECKLIST DE REGRESSAO - VEICULO

### Cadastro
- [ ] Cadastro completo de veiculo
- [ ] Validacao de placa (formato antigo)
- [ ] Validacao de placa (Mercosul)
- [ ] Validacao de ano
- [ ] Upload de foto do veiculo
- [ ] Upload de CRLV
- [ ] Tipos de veiculo

### Aprovacao
- [ ] Veiculo aprovado (notificacao + email)
- [ ] Veiculo rejeitado (notificacao + email)
- [ ] Corrigir e reenviar
- [ ] Mensagem personalizada do admin

### Edicao
- [ ] Editar cor
- [ ] Atualizar foto
- [ ] Atualizar CRLV
- [ ] Campos bloqueados

### Troca
- [ ] Trocar veiculo
- [ ] Veiculo antigo durante analise
- [ ] Placa duplicada

### Documentos
- [ ] CRLV vencido
- [ ] Lembrete de vencimento
- [ ] Atualizacao anual

---

## MATRIZ DE PERMISSOES

| Acao | Pendente | Aprovado | Rejeitado | Suspenso |
|------|----------|----------|-----------|----------|
| Visualizar veiculo | Sim | Sim | Sim | Sim |
| Editar dados | Sim | Parcial | Sim | Nao |
| Ficar online | Nao | Sim | Nao | Nao |
| Trocar veiculo | Nao | Sim | Sim | Nao |
| Atualizar CRLV | Sim | Sim | Sim | Nao |

---

## BUGS CONHECIDOS

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| VEI-001 | Foto do veiculo nao exibe no admin | Corrigido | 1.2.1 |
| VEI-002 | Placa Mercosul nao valida corretamente | Aberto | 1.2.0 |
| VEI-003 | Email de aprovacao nao enviado | Corrigido | 1.2.1 |
| VEI-004 | Status nao atualiza em tempo real | Investigando | 1.2.0 |

---

## NOTAS DO QA

1. **Fotos:** Testar com diferentes condicoes de luz
2. **Documentos:** Testar com documentos de diferentes estados
3. **Placa:** Testar todos os formatos (antigo, Mercosul)
4. **Integracao:** Verificar se dados batem com CRLV
5. **Admin:** Testar fluxo completo de aprovacao
6. **Email:** Verificar se emails chegam corretamente
7. **Notificacao:** Testar push notifications
