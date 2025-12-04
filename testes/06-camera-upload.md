# Plano de Testes - Camera e Upload de Imagens

## Objetivo
Validar a captura de fotos, selecao de imagens da galeria, compressao, upload e exibicao de imagens.

---

## TC-CAM-001: Permissao de Camera - Primeira Solicitacao
**Prioridade:** P0
**Pre-condicoes:** App instalado, permissao de camera nunca solicitada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Tirar foto do veiculo" | Solicita permissao de camera |
| 2 | Negar permissao | Exibe mensagem explicativa |
| 3 | Tocar novamente | Oferece abrir configuracoes |
| 4 | Conceder permissao | Camera abre corretamente |

---

## TC-CAM-002: Permissao de Galeria - Primeira Solicitacao
**Prioridade:** P0
**Pre-condicoes:** App instalado, permissao de galeria nunca solicitada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Selecionar da galeria" | Solicita permissao de fotos |
| 2 | Conceder acesso total | Galeria abre com todas as fotos |
| 3 | Selecionar foto | Foto carregada no app |

**Cenarios iOS 14+:**
- [ ] "Selecionar fotos" (acesso limitado)
- [ ] "Permitir acesso a todas as fotos"
- [ ] "Nao permitir"

---

## TC-CAM-003: Captura de Foto do Veiculo
**Prioridade:** P0
**Pre-condicoes:** Permissao de camera concedida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir camera para foto do veiculo | Camera abre em modo paisagem |
| 2 | Enquadrar veiculo | Preview em tempo real |
| 3 | Tocar para capturar | Foto tirada |
| 4 | Preview da foto | Exibida para confirmacao |
| 5 | Confirmar foto | Foto salva, retorna ao formulario |
| 6 | Verificar miniatura | Foto exibida corretamente |

**Validacoes de Qualidade:**
- [ ] Resolucao minima: 1280x720
- [ ] Formato: JPEG
- [ ] Qualidade: 80%
- [ ] Tamanho maximo apos compressao: 2MB

---

## TC-CAM-004: Captura de Documento (CNH/CRLV)
**Prioridade:** P0
**Pre-condicoes:** Permissao de camera concedida

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir camera para documento | Camera abre |
| 2 | Exibir guia de enquadramento | Retangulo de guia visivel |
| 3 | Posicionar documento | Detecta bordas automaticamente |
| 4 | Capturar automaticamente | Foto tirada quando bem enquadrado |
| 5 | Corrigir perspectiva | Documento "endireitado" |
| 6 | Confirmar | Imagem salva |

**Requisitos de Documento:**
- [ ] Texto legivel
- [ ] Sem reflexos
- [ ] Bordas visiveis
- [ ] Orientacao correta (retrato ou paisagem)

---

## TC-CAM-005: Selecao de Imagem da Galeria
**Prioridade:** P0
**Pre-condicoes:** Permissao de galeria concedida, fotos na galeria

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Selecionar da galeria" | Galeria abre |
| 2 | Navegar por albuns | Todos os albuns visiveis |
| 3 | Selecionar foto | Foto carregada |
| 4 | Permitir crop/ajuste | Editor basico disponivel |
| 5 | Confirmar selecao | Foto no formulario |

---

## TC-CAM-006: Crop e Ajuste de Imagem
**Prioridade:** P1
**Pre-condicoes:** Foto capturada ou selecionada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar foto | Editor abre |
| 2 | Ajustar area de crop | Proporcao correta (ex: 4:3) |
| 3 | Rotacionar se necessario | Rotacao em 90 graus |
| 4 | Aplicar | Imagem ajustada salva |

---

## TC-CAM-007: Compressao de Imagem Antes do Upload
**Prioridade:** P1
**Pre-condicoes:** Foto de alta resolucao (>5MB)

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar foto de 8MB | Foto carregada |
| 2 | App processa | Compressao automatica |
| 3 | Verificar tamanho final | < 2MB |
| 4 | Verificar qualidade | Visualmente aceitavel |
| 5 | Upload | Funciona sem erro de tamanho |

**Algoritmo de Compressao:**
1. Se > 4MB: reduzir resolucao para 1920x1080
2. Se ainda > 2MB: reduzir qualidade para 70%
3. Se ainda > 2MB: reduzir qualidade para 50%

---

## TC-CAM-008: Upload de Imagem - Fluxo Completo
**Prioridade:** P0
**Pre-condicoes:** Foto selecionada, internet disponivel

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar em "Salvar" | Upload inicia |
| 2 | Verificar feedback | Progress bar ou spinner |
| 3 | Aguardar upload | Completa em tempo razoavel |
| 4 | Verificar resposta | URL da imagem retornada |
| 5 | Verificar exibicao | Imagem carrega da URL |

---

## TC-CAM-009: Upload Interrompido - Retry
**Prioridade:** P0
**Pre-condicoes:** Upload em andamento

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Iniciar upload de foto | Progress 30% |
| 2 | Perder conexao | Upload pausa |
| 3 | Verificar estado | "Upload pausado" ou retry automatico |
| 4 | Reconectar internet | Upload retoma (nao reinicia do zero) |
| 5 | Verificar conclusao | Upload completa |

---

## TC-CAM-010: Upload de Multiplas Imagens
**Prioridade:** P1
**Pre-condicoes:** Formulario com multiplos campos de foto

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Adicionar foto do veiculo | OK |
| 2 | Adicionar foto do CRLV | OK |
| 3 | Adicionar frente da CNH | OK |
| 4 | Adicionar verso da CNH | OK |
| 5 | Salvar todos | Upload sequencial ou paralelo |
| 6 | Verificar progresso | Feedback para cada imagem |
| 7 | Uma falha | Nao afeta as outras |

---

## TC-CAM-011: Substituir Foto Existente
**Prioridade:** P1
**Pre-condicoes:** Foto ja cadastrada

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Ver foto atual do veiculo | Exibida corretamente |
| 2 | Tocar para alterar | Opcoes: camera ou galeria |
| 3 | Selecionar nova foto | Nova foto exibida |
| 4 | Salvar | Upload da nova foto |
| 5 | Verificar | Nova foto substituiu a antiga |

---

## TC-CAM-012: Camera com Pouca Luz
**Prioridade:** P2
**Pre-condicoes:** Ambiente com baixa luminosidade

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir camera em ambiente escuro | Flash disponivel |
| 2 | Ativar flash | Flash liga |
| 3 | Capturar foto | Foto com iluminacao adequada |
| 4 | Verificar qualidade | Documento legivel |

---

## TC-CAM-013: Camera Frontal vs Traseira
**Prioridade:** P2
**Pre-condicoes:** Dispositivo com duas cameras

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir camera para selfie | Camera frontal ativa |
| 2 | Verificar preview | Imagem espelhada |
| 3 | Capturar | Foto salva (nao espelhada) |
| 4 | Abrir camera para documento | Camera traseira ativa |

---

## TC-CAM-014: Formatos de Imagem Suportados
**Prioridade:** P1
**Pre-condicoes:** Imagens em diferentes formatos na galeria

| Formato | Suportado | Observacao |
|---------|-----------|------------|
| JPEG | Sim | Padrao |
| PNG | Sim | Convertido para JPEG no upload |
| HEIC (iOS) | Sim | Convertido para JPEG |
| WebP | Sim | Convertido para JPEG |
| GIF | Nao | Mensagem de erro |
| BMP | Nao | Mensagem de erro |

---

## TC-CAM-015: Imagem Corrompida ou Invalida
**Prioridade:** P1
**Pre-condicoes:** Arquivo de imagem corrompido

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Selecionar arquivo corrompido | Tenta carregar |
| 2 | Verificar erro | "Nao foi possivel carregar a imagem" |
| 3 | App estavel | Nao crashou |
| 4 | Permitir nova selecao | Usuario pode tentar outra foto |

---

## TC-CAM-016: Visualizacao de Foto em Tela Cheia
**Prioridade:** P1
**Pre-condicoes:** Foto cadastrada e exibida no app

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Tocar na miniatura | Abre em tela cheia |
| 2 | Pinch to zoom | Zoom in/out funciona |
| 3 | Arrastar | Pan funciona |
| 4 | Duplo toque | Zoom toggle |
| 5 | Fechar | Volta para tela anterior |

---

## TC-CAM-017: Cache de Imagens
**Prioridade:** P2
**Pre-condicoes:** Imagens ja carregadas uma vez

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Carregar tela com imagens | Download das imagens |
| 2 | Sair da tela | Cache armazenado |
| 3 | Voltar para a tela | Imagens carregam do cache |
| 4 | Verificar velocidade | Instantaneo (sem loading) |
| 5 | Modo offline | Imagens em cache disponiveis |

---

## TC-CAM-018: Interrupcao Durante Captura
**Prioridade:** P1
**Pre-condicoes:** Camera aberta para captura

| Passo | Acao | Resultado Esperado |
|-------|------|-------------------|
| 1 | Abrir camera | Camera ativa |
| 2 | Receber ligacao | Camera pausa |
| 3 | Encerrar ligacao | Voltar para camera |
| 4 | Verificar estado | Camera ainda funcional |

**Outros cenarios de interrupcao:**
- [ ] Notificacao push
- [ ] Alarme
- [ ] App em background (botao home)
- [ ] Bateria acabando (aviso)

---

## Matriz de Teste por Dispositivo

| Teste | iPhone SE | iPhone 14 | Galaxy A32 | Pixel 6 |
|-------|-----------|-----------|------------|---------|
| Camera frontal | OK | OK | OK | OK |
| Camera traseira | OK | OK | OK | OK |
| Flash | OK | OK | OK | OK |
| Galeria | OK | OK | OK | OK |
| HEIC | OK | OK | N/A | N/A |
| Compressao | OK | OK | OK | OK |
| Upload | OK | OK | OK | OK |

---

## Checklist de Regressao Camera/Upload

- [ ] Permissao de camera (conceder/negar)
- [ ] Permissao de galeria (conceder/negar)
- [ ] Captura de foto do veiculo
- [ ] Captura de documento
- [ ] Selecao da galeria
- [ ] Crop e ajuste
- [ ] Compressao automatica
- [ ] Upload com progresso
- [ ] Upload interrompido/retry
- [ ] Multiplas imagens
- [ ] Substituir foto existente
- [ ] Flash em ambiente escuro
- [ ] Visualizacao em tela cheia
- [ ] Cache de imagens
- [ ] Interrupcao durante captura

---

## Bugs Conhecidos

| ID | Descricao | Status | Versao |
|----|-----------|--------|--------|
| CAM-001 | Foto fica de cabeca para baixo em alguns Samsung | Corrigido | 1.1.0 |
| CAM-002 | HEIC nao converte em Android antigo | Aberto | 1.2.0 |
| CAM-003 | Progress bar trava em 99% as vezes | Investigando | 1.2.0 |

---

## Notas Tecnicas

1. **EXIF Orientation:** Sempre processar EXIF para corrigir orientacao
2. **HEIC/HEIF:** iOS usa HEIC por padrao, converter para JPEG no upload
3. **Memoria:** Cuidado com OutOfMemory ao processar fotos grandes
4. **Background:** Upload deve continuar mesmo com app em background
5. **Retry:** Implementar exponential backoff para retries de upload
