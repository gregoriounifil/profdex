# Performance do jogo

## 1. Budgets

Validar em dispositivo móvel intermediário e rede móvel simulada. Ajustar budgets somente com dados e decisão registrada.

| Métrica | Alvo | Gate máximo |
|---|---:|---:|
| LCP p75 | <= 2,5 s | 3,0 s |
| INP p75 | <= 200 ms | 300 ms |
| CLS p75 | <= 0,1 | 0,15 |
| JS inicial gzip | <= 200 KB | 250 KB |
| Chunk lazy de 3D/AR gzip | <= 250 KB | 350 KB |
| GLB mobile por personagem | <= 5 MB | 10 MB |
| Texture mobile | <= 1K por eixo por material comum | 2K |
| FPS batalha/3D | 60 alvo | 30 mínimo sustentado |
| Detecção de QR | 10–15 análises/s | sem loop irrestrito a 60 análises/s |
| API p95 leitura | <= 300 ms | 500 ms |
| API p95 escrita | <= 500 ms | 800 ms |
| Taxa de erro por fluxo | < 0,5% | 1% |

## 2. Build e carregamento

- Manter rotas lazy e medir chunks por rota.
- Separar Vue/core, batalha, model-viewer, Tres/Three e scanner somente quando melhorar cache/carregamento.
- Não aumentar `chunkSizeWarningLimit` para esconder regressão.
- Condicionar Vue DevTools ao modo development.
- Preload somente recurso necessário para o primeiro estado.
- Usar cache imutável para assets com hash e política apropriada para `public`.
- Evitar fonte externa bloqueante; hospedar localmente quando possível.
- Registrar bundle analysis antes/depois de mudanças grandes.

## 3. GLB, imagens e GPU

- Aplicar Draco/Meshopt e KTX2/Basis quando suportado.
- Remover nós, animações, materiais, texturas e atributos não usados.
- Reduzir polígonos e overdraw para o dispositivo alvo.
- Reusar geometria/material/textura e liberar recursos ao desmontar.
- Evitar duas instâncias pesadas do mesmo GLB quando sprite/impostor/clone otimizado resolver.
- Criar variantes LOD e mobile.
- Comprimir PNG/JPEG/WebP/AVIF conforme transparência e fidelidade.
- Medir download, parse, decode, upload à GPU e memória, não apenas tamanho em disco.

## 4. Scanner e câmera

- Limitar resolução de análise; mostrar vídeo em resolução maior se necessário, mas decodificar frame reduzido.
- Throttlar detecção para 10–15 fps e pausar enquanto uma leitura é processada.
- Considerar Worker/OffscreenCanvas para fallback JS.
- Não chamar `getImageData` em todo RAF sem budget.
- Cancelar RAF, tracks e promises ao desmontar.
- Reutilizar canvas e buffers.
- Medir bateria, temperatura e jank após dois minutos de uso.

## 5. Three.js e AR

- Usar uma única versão/runtime de Three.js.
- Carregar MindAR/model-viewer/Tres apenas na rota que necessita.
- Limitar `devicePixelRatio` a 2 ou menos em dispositivo móvel.
- Reduzir sombras, luzes e antialiasing quando o frame budget falhar.
- Suspender animação em aba oculta e tela desmontada.
- Descartar renderer, render targets, textures, geometries e listeners.
- Testar perda/restauração de contexto WebGL.

## 6. Vue e estado

- Evitar requests duplicadas e watchers profundos desnecessários.
- Paginar/virtualizar quando o catálogo crescer.
- Manter objetos 3D grandes fora de reatividade profunda.
- Não recalcular movesets, tipos ou assets em cada render.
- Debounce/throttle apenas com semântica de negócio preservada.
- Definir timeout, cancelamento com AbortController e política de retry.

## 7. Backend e banco

- Selecionar apenas campos necessários no Prisma.
- Não retornar tokens/segredos em nome de “evitar outra query”.
- Medir consultas e adicionar índices a filtros/ordens reais.
- Evitar N+1 e payload excessivo.
- Usar transações curtas, pooling correto e timeout.
- Adicionar cache apenas com invalidação e isolamento por usuário definidos.
- Executar load test em login, catálogo, discovery e capture.

## 8. Método de medição

1. Registrar aparelho, navegador, build, rede e dataset.
2. Fazer três warmups e pelo menos cinco medições.
3. Reportar mediana e p95/p75 conforme métrica.
4. Comparar baseline e candidato.
5. Guardar trace/profiler/bundle output quando houver regressão.
6. Reprovar se o gate máximo for excedido sem exceção explícita.

## 9. Performance atual a acompanhar

O relatório vigente deve atualizar estes indicadores:

- chunks acima de 500 KB;
- tamanho dos GLBs e markers;
- custo de dois `<model-viewer>` na arena;
- frequência do fallback `jsQR`;
- duplicação de Three.js entre bundle e CDN;
- memória após navegar repetidamente entre scan, capture e arena.
