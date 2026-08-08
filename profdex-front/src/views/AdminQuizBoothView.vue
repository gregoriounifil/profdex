<script setup>
/**
 * Bancada do quiz — tela de quiosque para o tablet do estande.
 *
 * Operada por um administrador, com o aluno do outro lado da mesa. O ciclo é
 * sempre o mesmo: matrícula → tema → 60 segundos de questão → resultado →
 * próximo aluno. A matrícula é pedida SEMPRE, porque quem responde muda a cada
 * rodada e nunca há sessão do aluno aqui.
 *
 * O cronômetro daqui é conforto visual: quem decide se o tempo acabou é o
 * servidor, na hora de conferir a resposta.
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { TYPE_CYCLE, getType } from '../data/types'

const router = useRouter()

const etapa = ref('matricula') // matricula | tema | pergunta | resultado
const carregando = ref(false)
const erro = ref('')

const matricula = ref('')
const aluno = ref(null)
const temas = ref([])

const sessao = ref(null)
const resultado = ref(null)
const escolhida = ref(null)

// ── Cronômetro ──────────────────────────────────────────────────────────────
const restanteMs = ref(0)
let ticker = null
let deadline = 0

const segundos = computed(() => Math.max(0, Math.ceil(restanteMs.value / 1000)))
const fracao = computed(() =>
  sessao.value ? Math.max(0, restanteMs.value / sessao.value.durationMs) : 0,
)
const apertado = computed(() => segundos.value <= 10)

function iniciarCronometro(durationMs) {
  pararCronometro()
  // Conta a partir do relógio LOCAL: o do tablet pode estar defasado do
  // servidor, e a barra andando errado assusta o aluno sem necessidade.
  deadline = Date.now() + durationMs
  restanteMs.value = durationMs
  ticker = setInterval(() => {
    restanteMs.value = Math.max(0, deadline - Date.now())
    if (restanteMs.value === 0) {
      pararCronometro()
      void responder(null)
    }
  }, 200)
}

function pararCronometro() {
  if (ticker) clearInterval(ticker)
  ticker = null
}

onBeforeUnmount(pararCronometro)

// ── Fluxo ───────────────────────────────────────────────────────────────────

const temaAtual = computed(() =>
  sessao.value ? getType(sessao.value.question.theme) : null,
)

const cor = computed(() => temaAtual.value?.color ?? 'var(--red)')

const DIFICULDADES = { facil: 'FÁCIL', media: 'MÉDIA', dificil: 'DIFÍCIL' }

const temasExibidos = computed(() =>
  TYPE_CYCLE.map((t) => {
    const dados = temas.value.find((x) => x.theme === t.id)
    const espera = aluno.value?.cooldowns.find((c) => c.theme === t.id)
    return {
      ...t,
      questoes: dados?.questoes ?? 0,
      professores: dados?.professores ?? [],
      esperaSegundos: espera?.segundosRestantes ?? 0,
    }
  }),
)

function mensagemDeErro(e, padrao) {
  if (!e.response) return 'Sem conexão com o servidor.'
  const dados = e.response.data
  if (typeof dados?.message === 'string') return dados.message
  if (Array.isArray(dados?.message)) return dados.message[0]
  return padrao
}

async function identificar() {
  const valor = matricula.value.trim()
  if (!valor) return
  carregando.value = true
  erro.value = ''
  try {
    const [a, t] = await Promise.all([
      api.get('/admin/quiz/aluno', { params: { matricula: valor } }),
      api.get('/admin/quiz/themes'),
    ])
    aluno.value = a.data
    temas.value = t.data
    etapa.value = 'tema'
  } catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível identificar o aluno.')
  } finally {
    carregando.value = false
  }
}

async function comecar(tema) {
  carregando.value = true
  erro.value = ''
  try {
    const { data } = await api.post('/admin/quiz/start', {
      matricula: aluno.value.matricula,
      theme: tema.id,
    })
    sessao.value = data
    escolhida.value = null
    resultado.value = null
    etapa.value = 'pergunta'
    iniciarCronometro(data.durationMs)
  } catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível sortear a questão.')
  } finally {
    carregando.value = false
  }
}

async function responder(indice) {
  if (!sessao.value || carregando.value) return
  pararCronometro()
  escolhida.value = indice
  carregando.value = true
  try {
    const corpo = { sessionId: sessao.value.sessionId }
    if (indice !== null) corpo.answerIndex = indice
    const { data } = await api.post('/admin/quiz/answer', corpo)
    resultado.value = data
    etapa.value = 'resultado'
  } catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível registrar a resposta.')
    etapa.value = 'tema'
  } finally {
    carregando.value = false
  }
}

/** Volta ao início — é o botão que o operador mais usa no dia. */
function proximoAluno() {
  pararCronometro()
  matricula.value = ''
  aluno.value = null
  sessao.value = null
  resultado.value = null
  escolhida.value = null
  erro.value = ''
  etapa.value = 'matricula'
}

function voltarAosTemas() {
  pararCronometro()
  sessao.value = null
  resultado.value = null
  erro.value = ''
  etapa.value = 'tema'
  // Os cooldowns mudaram: recarrega o cartão do aluno em silêncio.
  void api
    .get('/admin/quiz/aluno', { params: { matricula: aluno.value.matricula } })
    .then(({ data }) => (aluno.value = data))
    .catch(() => {})
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

function formatarEspera(s) {
  const min = Math.floor(s / 60)
  const resto = s % 60
  return min ? `${min}min ${resto}s` : `${resto}s`
}
</script>

<template>
  <div class="bancada" :style="{ '--tema': cor }">
    <!-- ── Matrícula ──────────────────────────────────────────────────── -->
    <section v-if="etapa === 'matricula'" class="cena cena--centro">
      <button class="sair" type="button" @click="router.push({ name: 'admin-quiz' })">
        ← Painel
      </button>

      <h1 class="pixel marca">QUIZ PROFDEX</h1>
      <p class="chamada">Digite a matrícula do aluno para começar</p>

      <form class="form-matricula" @submit.prevent="identificar">
        <input
          v-model="matricula"
          class="entrada"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          autofocus
          placeholder="MATRÍCULA"
          aria-label="Matrícula do aluno"
        />
        <button class="acao" type="submit" :disabled="carregando || !matricula.trim()">
          {{ carregando ? 'BUSCANDO…' : 'CONTINUAR' }}
        </button>
      </form>

      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    </section>

    <!-- ── Escolha do tema ────────────────────────────────────────────── -->
    <section v-else-if="etapa === 'tema'" class="cena">
      <header class="topo">
        <div>
          <span class="topo__eyebrow">ALUNO</span>
          <strong class="topo__nome">{{ aluno.name }}</strong>
          <span class="topo__matricula">{{ aluno.matricula }}</span>
        </div>
        <div class="topo__direita">
          <span class="topo__placar">
            {{ aluno.acertos }}/{{ aluno.tentativas }} acertos
          </span>
          <button class="sair sair--inline" type="button" @click="proximoAluno">
            Trocar aluno
          </button>
        </div>
      </header>

      <p class="chamada chamada--pequena">Escolha o tema da pergunta</p>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

      <div class="grade-temas">
        <button
          v-for="t in temasExibidos"
          :key="t.id"
          class="carta"
          type="button"
          :style="{ '--tema': t.color }"
          :disabled="carregando || !t.questoes || t.esperaSegundos > 0"
          @click="comecar(t)"
        >
          <span class="carta__icone">{{ t.icon }}</span>
          <span class="carta__nome">{{ t.label }}</span>
          <span v-if="t.esperaSegundos > 0" class="carta__aviso">
            aguarde {{ formatarEspera(t.esperaSegundos) }}
          </span>
          <span v-else-if="!t.questoes" class="carta__aviso">sem questões</span>
          <span v-else-if="t.professores.length" class="carta__aviso">
            {{ t.professores.map((p) => p.name).join(', ') }}
          </span>
        </button>
      </div>
    </section>

    <!-- ── Pergunta ───────────────────────────────────────────────────── -->
    <section v-else-if="etapa === 'pergunta'" class="cena cena--pergunta">
      <header class="faixa">
        <span class="faixa__tema">
          {{ temaAtual?.icon }} {{ temaAtual?.label }}
        </span>
        <span class="faixa__nivel">
          {{ DIFICULDADES[sessao.question.difficulty] }}
        </span>
        <span class="faixa__aluno">{{ sessao.aluno.name }}</span>
        <span class="relogio" :class="{ 'relogio--apertado': apertado }">
          {{ segundos }}s
        </span>
      </header>

      <div class="barra" aria-hidden="true">
        <div
          class="barra__cheia"
          :class="{ 'barra__cheia--apertado': apertado }"
          :style="{ width: fracao * 100 + '%' }"
        ></div>
      </div>

      <h2 class="enunciado">{{ sessao.question.prompt }}</h2>

      <div class="grade-alternativas">
        <button
          v-for="(opcao, i) in sessao.question.options"
          :key="i"
          class="alternativa"
          type="button"
          :disabled="carregando"
          @click="responder(i)"
        >
          <span class="alternativa__letra">{{ LETRAS[i] }}</span>
          <span class="alternativa__texto">{{ opcao }}</span>
        </button>
      </div>
    </section>

    <!-- ── Resultado ──────────────────────────────────────────────────── -->
    <section
      v-else-if="etapa === 'resultado'"
      class="cena cena--centro"
      :class="resultado.correct ? 'cena--acerto' : 'cena--erro'"
    >
      <span class="selo">{{ resultado.correct ? '✓' : '✕' }}</span>
      <h2 class="veredito">
        {{
          resultado.correct
            ? 'Acertou!'
            : resultado.expired
              ? 'Tempo esgotado'
              : 'Não foi dessa vez'
        }}
      </h2>

      <p v-if="!resultado.correct" class="gabarito">
        Resposta certa: <strong>{{ resultado.correctOption }}</strong>
      </p>

      <p v-if="resultado.correct && resultado.professores.length" class="instrucao">
        Agora escaneie o QR Code para capturar
        <strong>{{ resultado.professores.map((p) => p.name).join(' ou ') }}</strong
        >.
      </p>
      <p v-else-if="resultado.correct" class="instrucao">
        Procure o QR Code do professor deste tema para capturar.
      </p>
      <p v-else class="instrucao">
        Este tema libera de novo em 10 minutos. Enquanto isso dá para tentar
        outro tema.
      </p>

      <div class="botoes">
        <button class="acao acao--secundaria" type="button" @click="voltarAosTemas">
          OUTRO TEMA
        </button>
        <button class="acao" type="button" @click="proximoAluno">
          PRÓXIMO ALUNO
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Quiosque: ocupa a tela inteira e escala com ela. As medidas usam clamp()
   porque o mesmo layout roda em tablet deitado e em notebook touch. */
.bancada {
  position: fixed;
  inset: 0;
  display: flex;
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in srgb, var(--tema) 28%, transparent),
      transparent 60%
    ),
    var(--bg-deep, #10121a);
  color: var(--text, #fff);
  overflow: hidden;
}

.cena {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 2.2vh, 24px);
  padding: clamp(16px, 3vw, 40px);
}

.cena--centro {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.sair {
  position: absolute;
  top: 16px;
  left: 16px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 13px;
  cursor: pointer;
}

.sair--inline {
  position: static;
}

.marca {
  margin: 0;
  font-size: clamp(20px, 4vw, 40px);
  color: var(--yellow, #f7c948);
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.35);
}

.chamada {
  margin: 0;
  font-size: clamp(15px, 2.2vw, 22px);
  color: rgba(255, 255, 255, 0.75);
}

.chamada--pequena {
  font-size: clamp(13px, 1.6vw, 18px);
}

/* Matrícula */
.form-matricula {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(560px, 90vw);
}

.entrada {
  min-height: clamp(60px, 9vh, 88px);
  padding: 0 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 3px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: clamp(24px, 4vw, 40px);
  letter-spacing: 4px;
  text-align: center;
}

.entrada:focus {
  outline: none;
  border-color: var(--yellow, #f7c948);
}

.acao {
  min-height: clamp(56px, 8vh, 76px);
  padding: 0 28px;
  border-radius: 14px;
  background: var(--tema);
  color: #fff;
  border: none;
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 800;
  letter-spacing: 1px;
  cursor: pointer;
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.3);
}

.acao:disabled {
  opacity: 0.45;
  cursor: default;
}

.acao--secundaria {
  background: rgba(255, 255, 255, 0.12);
  border: 2px solid rgba(255, 255, 255, 0.25);
}

.erro {
  margin: 0;
  max-width: 60ch;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255, 90, 90, 0.12);
  border: 1px solid rgba(255, 120, 120, 0.5);
  color: #ffb3b3;
  font-size: clamp(13px, 1.6vw, 17px);
  line-height: 1.5;
}

/* Topo da escolha de tema */
.topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.topo__eyebrow {
  display: block;
  font-size: 11px;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.45);
}

.topo__nome {
  font-size: clamp(18px, 2.6vw, 30px);
}

.topo__matricula {
  margin-left: 10px;
  font-size: clamp(12px, 1.4vw, 16px);
  color: rgba(255, 255, 255, 0.5);
}

.topo__direita {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topo__placar {
  font-size: clamp(12px, 1.4vw, 16px);
  color: rgba(255, 255, 255, 0.6);
}

/* Grade de temas: 9 cartas que precisam caber sem rolagem no tablet deitado */
.grade-temas {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 18vw, 240px), 1fr));
  gap: clamp(8px, 1.4vw, 16px);
  overflow-y: auto;
}

.carta {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: clamp(96px, 16vh, 170px);
  padding: 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--tema) 22%, rgba(0, 0, 0, 0.35));
  border: 3px solid var(--tema);
  color: #fff;
  cursor: pointer;
  text-align: center;
}

.carta:active:not(:disabled) {
  transform: translateY(2px);
}

.carta:disabled {
  opacity: 0.35;
  cursor: default;
}

.carta__icone {
  font-size: clamp(26px, 4vw, 44px);
  line-height: 1;
}

.carta__nome {
  font-size: clamp(13px, 1.6vw, 19px);
  font-weight: 700;
}

.carta__aviso {
  font-size: clamp(10px, 1.1vw, 13px);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.35;
}

/* Pergunta */
.cena--pergunta {
  justify-content: flex-start;
}

.faixa {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.6vw, 20px);
  flex-wrap: wrap;
  font-size: clamp(12px, 1.5vw, 18px);
}

.faixa__tema {
  font-weight: 800;
  color: var(--tema);
}

.faixa__nivel {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: clamp(10px, 1.1vw, 13px);
  letter-spacing: 1px;
}

.faixa__aluno {
  color: rgba(255, 255, 255, 0.55);
}

.relogio {
  margin-left: auto;
  font-size: clamp(22px, 3.4vw, 44px);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.relogio--apertado {
  color: #ff6b6b;
}

.barra {
  height: clamp(8px, 1.2vh, 14px);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.barra__cheia {
  height: 100%;
  background: var(--tema);
  /* A largura vem do cronômetro a cada 200ms; a transição só suaviza o passo. */
  transition: width 0.2s linear;
}

.barra__cheia--apertado {
  background: #ff6b6b;
}

.enunciado {
  margin: 0;
  font-size: clamp(20px, 3.4vw, 42px);
  line-height: 1.25;
}

.grade-alternativas {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(240px, 40%, 460px), 1fr));
  gap: clamp(8px, 1.4vw, 18px);
}

.alternativa {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.4vw, 18px);
  padding: clamp(12px, 2vw, 24px);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 3px solid rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: clamp(15px, 2vw, 26px);
  text-align: left;
  cursor: pointer;
}

.alternativa:active:not(:disabled) {
  background: color-mix(in srgb, var(--tema) 30%, transparent);
  border-color: var(--tema);
}

.alternativa:disabled {
  opacity: 0.5;
  cursor: default;
}

.alternativa__letra {
  flex-shrink: 0;
  width: clamp(34px, 4vw, 54px);
  height: clamp(34px, 4vw, 54px);
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--tema);
  font-weight: 900;
  font-size: clamp(15px, 1.8vw, 24px);
}

.alternativa__texto {
  min-width: 0;
}

/* Resultado */
.cena--acerto {
  --tema: #2fbf71;
}

.cena--erro {
  --tema: #e5484d;
}

.selo {
  display: grid;
  place-items: center;
  width: clamp(80px, 12vw, 140px);
  height: clamp(80px, 12vw, 140px);
  border-radius: 50%;
  background: var(--tema);
  font-size: clamp(44px, 7vw, 80px);
  font-weight: 900;
  line-height: 1;
}

.veredito {
  margin: 0;
  font-size: clamp(26px, 4.4vw, 54px);
}

.gabarito,
.instrucao {
  margin: 0;
  max-width: 60ch;
  font-size: clamp(15px, 2vw, 24px);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
}

.instrucao strong,
.gabarito strong {
  color: #fff;
}

.botoes {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
