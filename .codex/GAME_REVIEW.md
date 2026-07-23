# Revisão de gameplay e domínio

## 1. Loop central

Validar a sequência autoritativa:

```text
autenticar -> ler QR -> validar prova -> descobrir personagem
-> cumprir condição de captura -> capturar -> selecionar -> batalhar
```

Nenhuma rota, chamada direta de API, alteração de estado local ou parâmetro deve pular uma etapa obrigatória.

## 2. Invariantes de progressão

- Um jogador só descobre personagem mediante prova válida reconhecida pelo servidor.
- Um jogador só captura personagem descoberto e após a condição definida pelo produto.
- Discovery e capture são idempotentes.
- Estados permitidos: `unknown -> discovered -> captured`; nunca regredir sem ação administrativa auditada.
- O catálogo público/autenticado não revela prova de desbloqueio.
- Personagem não capturado não participa de batalha quando essa for a regra do produto.
- Total, progresso e cards derivam da mesma fonte de verdade.
- Novos professores entram por dados/configuração, sem hardcode em várias telas.

## 3. Matriz de revisão do QR

| Caso | Resultado esperado |
|---|---|
| QR válido novo | Descobrir/capturar uma vez e registrar evento |
| QR válido repetido | Resposta idempotente, sem duplicação |
| QR inválido/malformado | Rejeitar sem revelar detalhes sensíveis |
| Token expirado/revogado | Rejeitar e orientar o jogador |
| Token de outro ambiente | Rejeitar |
| URL com host não confiável | Não tratar host como prova |
| Foto/replay | Aplicar política de replay/campanha |
| Duas leituras concorrentes | Uma transição consistente |
| API chamada sem câmera | Servidor ainda exigir prova válida |
| Professor inexistente | 404/erro de domínio consistente |

## 4. Motor de batalha

### Correção

- Injetar RNG para reproduzir seeds.
- Validar deck não vazio e movimento pertencente ao combatente.
- Limitar HP e stages em todos os caminhos.
- Definir ordem e regra de empate.
- Definir KO simultâneo, reflect, recoil e dano por turno.
- Fazer escudos e buffs expirarem conforme `turns`.
- Aplicar imunidade a todos os debuffs cobertos pelo texto.
- Definir se status atravessa block/evade.
- Definir precisamente “desfazer dano” e janela temporal.
- Garantir que IA sempre escolha movimento válido.

### Balanceamento

- Simular milhares de batalhas com seed e distribuição de tipos.
- Medir win rate por personagem, matchup e primeiro turno.
- Alertar matchup fora da faixa acordada, por exemplo 40–60% sem intenção explícita.
- Medir duração mediana, caudas longas e loops sem fim.
- Separar bug de balanceamento de escolha de design.

### Testes de propriedades

- `0 <= hp <= maxHp`.
- `-6 <= stage <= 6`.
- Dano, cura e número de hits nunca são negativos.
- Um turno encerrado não executa ação posterior ao KO.
- Mesmo seed + mesma entrada produz mesmos eventos.
- Nenhum evento referencia alvo inexistente.
- Batalha termina ou atinge um limite explícito de turnos.

## 5. UX, acessibilidade e resiliência

- Exibir instrução clara antes de pedir câmera.
- Diferenciar scanning, found, discovering, captured, error e retry.
- Manter controle acessível por teclado, foco visível e texto alternativo.
- Respeitar `prefers-reduced-motion`.
- Não bloquear zoom do usuário sem justificativa de acessibilidade.
- Manter contraste e alvos de toque adequados.
- Não apresentar botão sem ação; usar disabled + “em breve” quando necessário.
- Preservar navegação em refresh/deep link e informar backend offline.

## 6. AR e 3D

- Detectar suporte antes de oferecer AR.
- Liberar câmera, WebGL, RAF, listeners, GLTF e textures ao desmontar.
- Evitar duplicar runtime/versões de Three.js.
- Fornecer fallback 2D/3D sem câmera.
- Testar baixa luz, target perdido, dois markers trocados e dispositivo sem WebXR.
- Verificar licença, tamanho, origem e versão de cada modelo.

## 7. Arquitetura recomendada do domínio

```text
Catalog -> DiscoveryPolicy -> CapturePolicy -> ProgressRepository
                                      |
                                      v
                               Audit/Event Log

BattleData -> Pure Battle Engine -> UI Event Adapter -> Vue View
```

- Manter políticas no backend.
- Manter motor de batalha puro e independente de Vue.
- Manter UI responsável apenas por entrada, apresentação e animação.
- Evoluir para servidor autoritativo se batalha gerar recompensa, ranking ou competição.

## 8. Definition of Done de uma mecânica

- Regra e edge cases documentados.
- Contrato de dados versionado.
- Testes unitários e integração cobrindo sucesso/falha.
- Telemetria definida.
- Performance medida em dispositivo alvo.
- Acessibilidade e fallback verificados.
- Threat model atualizado.
- Migração/compatibilidade de save/progressão planejada.
