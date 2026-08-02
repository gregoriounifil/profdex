<script setup>
import { computed } from 'vue'

const props = defineProps({
  users: {
    type: Array,
    required: true,
  },
})

const sortedUsers = computed(() =>
  [...props.users].sort((a, b) => b.pontuacao - a.pontuacao),
)

const podiumUsers = computed(() => {
  const users = sortedUsers.value
  return [
    { ...users[1], position: 2, metal: 'silver' },
    { ...users[0], position: 1, metal: 'gold' },
    { ...users[2], position: 3, metal: 'bronze' },
  ].filter((user) => user.id)
})

const remainingUsers = computed(() => sortedUsers.value.slice(3))

const pointsFormatter = new Intl.NumberFormat('pt-BR')
const formatPoints = (points) => pointsFormatter.format(points)
</script>

<template>
  <section class="leaderboard" aria-labelledby="leaderboard-title">
    <header class="leaderboard__header">
      <h1 id="leaderboard-title">Ranking de Pontos</h1>
      <p>Os melhores da temporada</p>
    </header>

    <div class="podium" aria-label="Pódio dos três primeiros colocados">
      <article
        v-for="user in podiumUsers"
        :key="user.id"
        class="podium-card"
        :class="[`podium-card--${user.metal}`, { 'podium-card--winner': user.position === 1 }]"
      >
        <div class="podium-card__avatar-wrap">
          <img
            class="podium-card__avatar"
            :src="user.url_da_foto"
            :alt="`Foto de ${user.nome}`"
          />
        </div>

        <div class="podium-card__position" :aria-label="`${user.position}º lugar`">
          {{ user.position }}
        </div>
        <h2>{{ user.nome }}</h2>
        <p>{{ formatPoints(user.pontuacao) }} <span>pts</span></p>
      </article>
    </div>

    <ol class="ranking-list" :start="4" aria-label="Demais posições do ranking">
      <li
        v-for="(user, index) in remainingUsers"
        :key="user.id"
        class="ranking-row"
      >
        <span class="ranking-row__position" aria-hidden="true">{{ index + 4 }}</span>
        <span class="ranking-row__name">{{ user.nome }}</span>
        <span class="ranking-row__points">
          {{ formatPoints(user.pontuacao) }} <small>pts</small>
        </span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.leaderboard {
  --gold: #f2c14e;
  --silver: #cbd2dc;
  --bronze: #c77b46;
  --accent: #8b5cf6;
  width: min(100%, 1120px);
  margin: 0 auto;
}

.leaderboard__header {
  margin-bottom: clamp(36px, 6vw, 72px);
  text-align: center;
}

.leaderboard__header h1 {
  color: #f7f8fb;
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 900;
  letter-spacing: -0.055em;
  line-height: 1;
}

.leaderboard__header p {
  margin-top: 12px;
  color: #828896;
  font-size: clamp(0.95rem, 1.8vw, 1.25rem);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.podium {
  display: grid;
  grid-template-columns: 1fr 1.12fr 1fr;
  align-items: end;
}

.podium-card {
  --metal: var(--silver);
  position: relative;
  min-width: 0;
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 34px 24px 28px;
  border: 1px solid color-mix(in srgb, var(--metal) 66%, transparent);
  background:
    radial-gradient(circle at 50% 10%, color-mix(in srgb, var(--metal) 9%, transparent), transparent 38%),
    linear-gradient(180deg, #11141b 0%, #0c0f15 100%);
  box-shadow: inset 0 1px color-mix(in srgb, var(--metal) 22%, transparent);
}

.podium-card:first-child {
  border-radius: 20px 0 0 0;
  border-right: 0;
}

.podium-card:last-child {
  border-radius: 0 20px 0 0;
  border-left: 0;
}

.podium-card--gold {
  --metal: var(--gold);
}

.podium-card--bronze {
  --metal: var(--bronze);
}

.podium-card--winner {
  z-index: 2;
  min-height: 395px;
  border-radius: 20px 20px 0 0;
  box-shadow:
    0 -10px 55px rgba(242, 193, 78, 0.08),
    inset 0 1px rgba(255, 232, 163, 0.45);
}

.podium-card__avatar-wrap {
  width: clamp(104px, 12vw, 142px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  padding: 5px;
  border: 2px solid var(--metal);
  border-radius: 50%;
  background: #10131a;
  box-shadow:
    0 0 0 5px color-mix(in srgb, var(--metal) 12%, transparent),
    0 16px 30px rgba(0, 0, 0, 0.35);
}

.podium-card--winner .podium-card__avatar-wrap {
  width: clamp(126px, 14vw, 164px);
  border-width: 3px;
}

.podium-card__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #20242d;
}

.podium-card__position {
  color: var(--metal);
  font-size: clamp(3rem, 6vw, 5.25rem);
  font-weight: 950;
  letter-spacing: -0.08em;
  line-height: 0.95;
  text-shadow: 0 4px 24px color-mix(in srgb, var(--metal) 24%, transparent);
}

.podium-card h2 {
  width: 100%;
  margin-top: 14px;
  overflow: hidden;
  color: #f5f6f8;
  font-size: clamp(1rem, 2.2vw, 1.55rem);
  font-weight: 850;
  letter-spacing: -0.025em;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-card p {
  margin-top: 7px;
  color: color-mix(in srgb, var(--metal) 75%, #a6aab2);
  font-size: clamp(0.95rem, 1.9vw, 1.25rem);
  font-weight: 700;
}

.podium-card p span,
.ranking-row__points small {
  font-size: 0.72em;
  font-weight: 700;
}

.ranking-list {
  overflow: hidden;
  border: 1px solid #252a35;
  border-top: 2px solid var(--accent);
  border-radius: 0 0 20px 20px;
  background: #0e1117;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
  list-style: none;
}

.ranking-row {
  min-height: 76px;
  display: grid;
  grid-template-columns: 92px 1fr auto;
  align-items: center;
  border-bottom: 1px solid #252a35;
}

.ranking-row:last-child {
  border-bottom: 0;
}

.ranking-row__position {
  align-self: stretch;
  display: grid;
  place-items: center;
  border-right: 1px solid #252a35;
  color: #a7acb6;
  font-size: 1.8rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.ranking-row__name {
  padding: 0 34px;
  color: #f2f3f5;
  font-size: clamp(1rem, 2vw, 1.2rem);
  font-weight: 800;
}

.ranking-row__points {
  padding-right: 34px;
  color: #c5c9d1;
  font-size: clamp(0.95rem, 1.8vw, 1.15rem);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .leaderboard__header {
    margin-bottom: 58px;
  }

  .podium {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .podium-card {
    min-height: 250px;
    padding: 22px 8px 20px;
  }

  .podium-card--winner {
    min-height: 290px;
  }

  .podium-card__avatar-wrap {
    width: clamp(72px, 22vw, 98px);
    margin-bottom: 14px;
  }

  .podium-card--winner .podium-card__avatar-wrap {
    width: clamp(84px, 25vw, 112px);
  }

  .podium-card__position {
    font-size: clamp(2.45rem, 13vw, 3.75rem);
  }

  .podium-card h2 {
    font-size: clamp(0.78rem, 3.6vw, 1rem);
  }

  .podium-card p {
    font-size: clamp(0.72rem, 3.2vw, 0.95rem);
  }

  .ranking-row {
    min-height: 66px;
    grid-template-columns: 60px 1fr auto;
  }

  .ranking-row__position {
    font-size: 1.35rem;
  }

  .ranking-row__name {
    padding: 0 16px;
  }

  .ranking-row__points {
    padding-right: 16px;
  }
}

@media (max-width: 430px) {
  .podium-card__avatar-wrap {
    width: 68px;
  }

  .podium-card--winner .podium-card__avatar-wrap {
    width: 82px;
  }

  .podium-card h2 {
    font-size: 0.75rem;
  }

  .podium-card p {
    font-size: 0.68rem;
  }

  .ranking-row {
    grid-template-columns: 52px minmax(0, 1fr) auto;
  }

  .ranking-row__name {
    overflow: hidden;
    padding: 0 12px;
    font-size: 0.9rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ranking-row__points {
    padding-right: 12px;
    font-size: 0.82rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .podium-card {
    animation: leaderboard-reveal 0.55s both;
  }

  .podium-card:nth-child(2) {
    animation-delay: 90ms;
  }

  .podium-card:nth-child(3) {
    animation-delay: 180ms;
  }

  .ranking-row {
    animation: leaderboard-reveal 0.45s both;
    animation-delay: calc(var(--row-index, 0) * 40ms + 180ms);
  }
}

@keyframes leaderboard-reveal {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
</style>
