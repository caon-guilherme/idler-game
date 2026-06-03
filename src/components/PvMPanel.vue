<script setup>
const props = defineProps({
  MONSTERS: Array,
  selectedMonster: String,
  isFighting: Boolean,
  fightProgress: Number,
  powerLevel: Number,
  currentMonster: Object,
  fightSuccessChance: Function,
  startFight: Function,
  selectMonster: Function,
  activeTab: String,
  tabOrder: Array,
  TAB_DEFS: Object,
  isIdle: Boolean,
  timerProgress: Number,
  autoplaySkill: String,
  currentAutoplayRecipe: Object,
  armorFragments: Number,
  anyBusy: Boolean,
})

const emit = defineEmits(['setTab', 'dragStart', 'dragOver', 'dragEnd', 'toggleIdle'])

const monsterColor = (monster) => {
  const diff = props.powerLevel - monster.level
  if (diff <= 0) return '#ff3860'
  if (diff <= 3) return '#ff8c00'
  if (diff <= 7) return '#ffd700'
  return '#00ff9f'
}
</script>

<template>
  <div class="tradeskill-frame">
    <div class="tradeskill-title-bar">
      <span class="tradeskill-title">⚔️ PvM - Monstros</span>
      <div class="title-bar-right">
        <div class="autoplay-toggle" @click="emit('toggleIdle')" :title="isIdle ? 'Desativar Automático' : 'Ativar Automático'">
          <span class="autoplay-icon">⚡</span>
          <span class="autoplay-status" :class="{ active: isIdle }">{{ isIdle ? 'ON' : 'OFF' }}</span>
          <span v-if="isIdle" class="autoplay-target">{{ TAB_DEFS[activeTab].icon }} {{ TAB_DEFS[activeTab].label }}</span>
        </div>
        <span class="tradeskill-level">Poder: {{ powerLevel }} | 🔮 {{ armorFragments }}</span>
      </div>
    </div>

    <div v-show="isIdle" class="panel-timer">
      <div class="panel-timer-fill" :style="{ width: timerProgress + '%' }"></div>
      <span v-if="currentAutoplayRecipe" class="panel-timer-label">{{ currentAutoplayRecipe.icon }} {{ currentAutoplayRecipe.name }}</span>
    </div>

    <div class="tab-bar">
      <button
        v-for="id in tabOrder"
        :key="id"
        class="tab-btn"
        :class="{ active: activeTab === id }"
        draggable="true"
        @click="emit('setTab', id)"
        @dragstart="emit('dragStart', id)"
        @dragover.prevent="emit('dragOver', $event, id)"
        @dragend="emit('dragEnd')"
      >
        <span class="drag-handle">⠿</span>
        {{ TAB_DEFS[id].icon }} {{ TAB_DEFS[id].label }}
      </button>
    </div>

    <div class="pvm-body">
      <div class="monster-list">
        <div class="list-header">Monstros</div>
        <div class="list-scroll">
          <button
            v-for="m in MONSTERS"
            :key="m.id"
            class="monster-btn"
            :class="{ active: selectedMonster === m.id }"
            @click="selectMonster(m.id)"
          >
            <span class="monster-icon">{{ m.icon }}</span>
            <div class="monster-info">
              <span class="monster-name">{{ m.name }}</span>
              <span class="monster-level">Nv. {{ m.level }}</span>
            </div>
            <div class="monster-right">
              <span class="monster-diff" :style="{ background: monsterColor(m) }"></span>
              <span class="monster-frags">🔮 {{ m.minFrags }}-{{ m.maxFrags }}</span>
            </div>
          </button>
        </div>
      </div>

      <div class="monster-detail">
        <div class="detail-icon">
          <span>{{ currentMonster.icon }}</span>
        </div>
        <div class="detail-name">{{ currentMonster.name }}</div>
        <div class="detail-desc">{{ currentMonster.desc }}</div>

        <div class="detail-stats">
          <div class="stat-row">
            <span>Nível do Monstro</span>
            <span :style="{ color: monsterColor(currentMonster) }">{{ currentMonster.level }}</span>
          </div>
          <div class="stat-row">
            <span>Seu Poder</span>
            <span :style="{ color: powerLevel >= currentMonster.level ? '#00ff9f' : '#ff3860' }">{{ powerLevel }}</span>
          </div>
          <div class="stat-row">
            <span>Chance de Vitória</span>
            <span style="color: #00f0ff">{{ Math.floor(fightSuccessChance(currentMonster) * 100) }}%</span>
          </div>
          <div class="stat-row">
            <span>Fragmentos</span>
            <span style="color: #ffd700">{{ currentMonster.minFrags }}-{{ currentMonster.maxFrags }}</span>
          </div>
        </div>

        <button
          class="craft-btn"
          :class="{ crafting: isFighting }"
          :disabled="anyBusy"
          @click="startFight()"
        >
          <span v-if="!isFighting">⚔️</span>
          <span v-else class="craft-spinner">⚔️</span>
          <span>{{ isFighting ? 'Lutando...' : 'Atacar ' + currentMonster.name }}</span>
          <span v-if="isFighting" class="craft-pct">{{ Math.floor(fightProgress) }}%</span>
          <div v-if="isFighting" class="craft-progress-bar">
            <div class="craft-progress-fill" :style="{ width: fightProgress + '%' }"></div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tradeskill-frame {
  background: linear-gradient(180deg, #1a1210, #0f0a08);
  border: 2px solid #6b4c2a;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tradeskill-title-bar {
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  border-bottom: 2px solid #8b6b3a;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tradeskill-title {
  color: #ffd700;
  font-weight: 700;
  font-size: 0.95rem;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.tradeskill-level {
  color: #8b7355;
  font-size: 0.8rem;
  font-weight: 500;
}

.panel-timer {
  position: relative;
  height: 18px;
  background: rgba(0,0,0,0.4);
  overflow: hidden;
}

.panel-timer-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #b8860b, #ffd700, #b8860b);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
  transition: width 0.1s linear;
}

.panel-timer-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 6px rgba(0,0,0,0.9);
  letter-spacing: 0.3px;
  pointer-events: none;
  z-index: 2;
}

.title-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.autoplay-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 8px;
  border: 1px solid #6b4c2a;
  border-radius: 3px;
  background: rgba(0,0,0,0.3);
  transition: all 0.15s ease;
  user-select: none;
}

.autoplay-toggle:hover {
  border-color: #ffd700;
  background: rgba(60, 40, 25, 0.3);
}

.autoplay-icon {
  font-size: 0.75rem;
}

.autoplay-status {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #8b7355;
}

.autoplay-status.active {
  color: #ffd700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

.autoplay-target {
  font-size: 0.7rem;
  color: #00f0ff;
  font-weight: 600;
  margin-left: 2px;
}

.tab-bar {
  display: flex;
  gap: 2px;
  padding: 4px 4px 0;
  background: rgba(0,0,0,0.15);
  border-bottom: 1px solid rgba(107, 76, 42, 0.2);
}

.drag-handle {
  font-size: 0.65rem;
  color: #554433;
  margin-right: 3px;
  cursor: grab;
}

.tab-btn {
  padding: 5px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: 'Outfit', sans-serif;
  background: rgba(60, 40, 25, 0.25);
  border: 1px solid rgba(107, 76, 42, 0.2);
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  color: #8b7355;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.tab-btn:hover {
  background: rgba(80, 55, 35, 0.3);
  color: #c0a88a;
}

.tab-btn.active {
  background: linear-gradient(180deg, #1a1210, #0f0a08);
  border-color: #6b4c2a;
  color: #ffd700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
}

.pvm-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.monster-list {
  border-right: 1px solid rgba(107, 76, 42, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.list-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.monster-btn {
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 6px;
  align-items: center;
  padding: 8px;
  background: rgba(60, 40, 25, 0.15);
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #c0a88a;
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  text-align: left;
  transition: all 0.15s ease;
}

.monster-btn:hover {
  background: rgba(80, 55, 35, 0.3);
  border-color: rgba(107, 76, 42, 0.4);
}

.monster-btn.active {
  background: rgba(100, 70, 40, 0.3);
  border-color: #ffd700;
}

.monster-icon { font-size: 1.3rem; }

.monster-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.monster-diff {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 4px currentColor;
}

.monster-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.monster-name {
  font-weight: 600;
  font-size: 0.8rem;
}

.monster-level {
  font-size: 0.7rem;
  color: #8b7355;
}

.monster-frags {
  font-size: 0.75rem;
  color: #ffd700;
  font-weight: 600;
}

.monster-detail {
  padding: clamp(8px, 1.2vw, 16px);
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.6vw, 8px);
  overflow-y: auto;
  min-width: 0;
}

.detail-icon {
  font-size: 2.5rem;
  text-align: center;
  padding: 8px;
  background: rgba(60, 40, 25, 0.2);
  border: 1px solid rgba(107, 76, 42, 0.3);
  border-radius: 6px;
  width: 60px;
  margin: 0 auto;
  flex-shrink: 0;
}

.detail-name {
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  color: #e0d0b8;
  flex-shrink: 0;
}

.detail-desc {
  font-size: 0.75rem;
  color: #8b7355;
  text-align: center;
  flex-shrink: 0;
}

.detail-stats {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(107, 76, 42, 0.2);
  border-radius: 4px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #8b7355;
}

.craft-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  border: 2px solid #8b6b3a;
  border-radius: 4px;
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  color: #ffd700;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
  margin-top: auto;
}

.craft-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #5a3d25, #3d2817);
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
}

.craft-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.craft-btn.crafting {
  position: relative;
  overflow: hidden;
}

.craft-btn.crafting:disabled {
  opacity: 1;
}

.craft-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.craft-pct {
  font-size: 0.7rem;
  color: #8b7355;
  min-width: 30px;
  text-align: right;
}

.craft-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: rgba(0,0,0,0.4);
}

.craft-progress-fill {
  height: 100%;
  background: #ff3860;
  box-shadow: 0 0 6px rgba(255, 56, 96, 0.5);
  transition: width 0.1s linear;
}

.list-scroll::-webkit-scrollbar {
  width: 5px;
}
.list-scroll::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3);
}
.list-scroll::-webkit-scrollbar-thumb {
  background: #6b4c2a;
  border-radius: 2px;
}

.list-scroll {
  scrollbar-width: thin;
  scrollbar-color: #6b4c2a rgba(0,0,0,0.3);
}
</style>
