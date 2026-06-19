<script setup>
import { ref } from 'vue'

const props = defineProps({
  professor: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})

const imgError = ref(false)
const cartoonSrc = `/professors/${props.professor.slug}-cartoon.png`
</script>

<template>
  <div
    class="prof-card"
    :class="{
      'prof-card--captured': professor.captured,
      'prof-card--discovered': professor.discovered && !professor.captured,
      'prof-card--unknown': !professor.discovered,
    }"
  >
    <div class="prof-card__inner">
      <div class="prof-card__num pixel">
        #{{ String(index + 1).padStart(3, '0') }}
      </div>

      <div class="prof-card__avatar">
        <template v-if="professor.captured">
          <img
            v-if="!imgError"
            :src="cartoonSrc"
            :alt="professor.name"
            class="avatar-img"
            @error="imgError = true"
          />
          <div v-else class="avatar-fallback" :style="{ background: `hsl(${index * 110}, 60%, 40%)` }">
            {{ professor.name[0] }}
          </div>
          <div class="captured-badge">✓</div>
        </template>

        <template v-else-if="professor.discovered">
          <div class="avatar-silhouette">👤</div>
          <div class="discovered-badge">!</div>
        </template>

        <template v-else>
          <div class="avatar-unknown">
            <span class="pixel">???</span>
          </div>
        </template>
      </div>

      <div class="prof-card__name">
        <span v-if="professor.captured">{{ professor.name }}</span>
        <span v-else-if="professor.discovered">{{ professor.name }}</span>
        <span v-else class="pixel" style="font-size: 8px; color: var(--text-muted)">???</span>
      </div>

      <div class="prof-card__status pixel">
        <span v-if="professor.captured" class="status-captured">CAPTURADO</span>
        <span v-else-if="professor.discovered" class="status-discovered">ENCONTRADO</span>
        <span v-else class="status-unknown">???</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prof-card {
  border-radius: var(--radius-lg);
  border: 2px solid var(--border);
  background: var(--bg-card);
  overflow: hidden;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.prof-card--captured {
  border-color: var(--yellow);
  box-shadow: 0 0 16px rgba(255, 222, 0, 0.2);
}

.prof-card__inner {
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.prof-card__num {
  font-size: 7px;
  color: var(--text-muted);
  align-self: flex-start;
}

.prof-card--captured .prof-card__num {
  color: var(--yellow);
}

.prof-card__avatar {
  width: 72px;
  height: 72px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--yellow);
}

.avatar-fallback {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 28px;
  color: white;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.3);
  border: 2px solid var(--yellow);
}

.avatar-silhouette {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1a1a3a;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  filter: grayscale(1) opacity(0.7);
}

.avatar-unknown {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1a1a3a;
  border: 2px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: var(--text-muted);
}

.captured-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  background: var(--yellow);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--bg);
  font-weight: 900;
}

.discovered-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  background: var(--red);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: white;
  font-weight: 900;
  animation: pulse 1.5s ease-in-out infinite;
}

.prof-card__name {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  min-height: 18px;
}


.prof-card__status {
  font-size: 7px;
  letter-spacing: 0.5px;
}

.status-captured { color: var(--yellow); }
.status-discovered { color: var(--red-light); }
.status-unknown { color: var(--text-muted); }
</style>
