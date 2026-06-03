<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  logs: Array,
})

const panelRef = ref(null)

watch(() => props.logs, async () => {
  await nextTick()
  if (panelRef.value) {
    panelRef.value.scrollTop = panelRef.value.scrollHeight
  }
  requestAnimationFrame(() => {
    if (panelRef.value) {
      panelRef.value.scrollTop = panelRef.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<template>
  <div class="console-frame">
    <div class="console-title-bar">
      <span class="console-title">Console</span>
    </div>
    <div ref="panelRef" class="console-body">
      <TransitionGroup name="log">
        <div
          v-for="(log, i) in logs"
          :key="i"
          class="log-line"
          :class="log.type"
        >
          <span v-if="log.type !== 'system'" class="log-arrow">></span>
          <span v-else class="log-arrow" style="visibility:hidden">></span>
          {{ log.message }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.console-frame {
  background: linear-gradient(180deg, #1a1210 0%, #0f0a08 100%);
  border: 2px solid #6b4c2a;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
}

.console-title-bar {
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  border-bottom: 2px solid #8b6b3a;
  padding: 6px 14px;
}

.console-title {
  color: #ffd700;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.console-body {
  height: clamp(80px, 12vh, 160px);
  overflow-y: auto;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  line-height: 1.7;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.log-line {
  color: #c0a88a;
  border-left: 2px solid transparent;
  padding-left: 6px;
}

.log-line.normal { border-left-color: #8b6b3a; }
.log-line.combat { color: #ff8c00; border-left-color: #ff8c00; }
.log-line.loot { color: #ffd700; border-left-color: #ffd700; }
.log-line.blessing { color: #00ff9f; border-left-color: #00ff9f; }
.log-line.system { color: #665544; font-style: italic; }

.log-arrow {
  color: #8b6b3a;
  margin-right: 6px;
}

.log-enter-active {
  transition: all 0.25s ease-out;
}
.log-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.console-body::-webkit-scrollbar {
  width: 5px;
}
.console-body::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3);
}
.console-body::-webkit-scrollbar-thumb {
  background: #6b4c2a;
  border-radius: 2px;
}

.console-body {
  scrollbar-width: thin;
  scrollbar-color: #6b4c2a rgba(0,0,0,0.3);
}
</style>
