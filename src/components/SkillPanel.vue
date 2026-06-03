<script setup>
import { computed } from 'vue'

const props = defineProps({
  skills: Object,
  RECIPES: Object,
  selectedSkill: String,
  selectedRecipe: String,
  isIdle: Boolean,
  isCrafting: Boolean,
  craftProgress: Number,
  inventory: Object,
  recipeColor: Function,
  craftFlash: Number,
  autoplaySkill: String,
  activeTab: String,
  tabOrder: Array,
  TAB_DEFS: Object,
  timerProgress: Number,
  currentAutoplayRecipe: Object,
  currentCraftRecipe: Object,
  anyBusy: Boolean,
})

const emit = defineEmits(['selectRecipe', 'selectSkill', 'action', 'toggleIdle', 'setTab', 'dragStart', 'dragOver', 'dragEnd'])

const skillList = [
  { id: 'woodcutting', icon: '🪓', label: 'Woodcutting' },
  { id: 'mining', icon: '⛏️', label: 'Mining' },
  { id: 'fishing', icon: '🎣', label: 'Fishing' },
  { id: 'cooking', icon: '🍳', label: 'Cooking' },
]

const skill = computed(() => props.skills[props.selectedSkill])
const recipes = computed(() => props.RECIPES[props.selectedSkill])
const activeRecipe = computed(() => recipes.value.find(r => r.id === props.selectedRecipe) || recipes.value[0])

const colorMap = {
  orange: '#ff8c00',
  yellow: '#ffd700',
  green: '#00ff9f',
  grey: '#666',
  locked: '#444',
}
</script>

<template>
  <div class="tradeskill-frame">
    <div class="tradeskill-title-bar">
      <span class="tradeskill-title">{{ skill.icon }} {{ skill.name }}</span>
      <div class="title-bar-right">
        <div class="autoplay-toggle" @click="emit('toggleIdle')" :title="isIdle ? 'Desativar Automático' : 'Ativar Automático'">
          <span class="autoplay-icon">⚡</span>
          <span class="autoplay-status" :class="{ active: isIdle }">{{ isIdle ? 'ON' : 'OFF' }}</span>
          <span v-if="isIdle" class="autoplay-target">{{ TAB_DEFS[activeTab].icon }} {{ TAB_DEFS[activeTab].label }}</span>
        </div>
        <span class="tradeskill-level">Nv. {{ skill.level }}</span>
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

    <div class="tradeskill-body">
      <div class="skill-sidebar">
        <nav class="skills-menu">
          <button
            v-for="skill in skillList"
            :key="skill.id"
            class="prof-btn"
            :class="{ active: selectedSkill === skill.id }"
            @click="emit('selectSkill', skill.id)"
          >
            <span class="prof-icon">{{ skill.icon }}</span>
            <div class="prof-info">
              <span class="prof-name">{{ skill.label }}</span>
              <span class="prof-level">Nv. {{ skills[skill.id].level }}</span>
            </div>
            <div class="prof-bar-bg">
              <div
                class="prof-bar-fill"
                :style="{ width: skills[skill.id].xpProgress + '%', background: skills[skill.id].color }"
              ></div>
            </div>
          </button>
        </nav>

        <div class="inventory-box">
          <div class="inv-title">Recursos</div>
          <div class="inv-grid">
            <div class="inv-row">
              <span>🪓</span><span class="inv-name">Madeira</span><span class="inv-qty">{{ inventory.logs }}</span>
            </div>
            <div class="inv-row">
              <span>⛏️</span><span class="inv-name">Minério</span><span class="inv-qty">{{ inventory.ores }}</span>
            </div>
            <div class="inv-row">
              <span>🎣</span><span class="inv-name">Peixe</span><span class="inv-qty">{{ inventory.fish }}</span>
            </div>
            <div class="inv-row">
              <span>🍳</span><span class="inv-name">Comida</span><span class="inv-qty">{{ inventory.food }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="recipe-list">
        <div class="list-header">Receitas</div>
        <div class="list-scroll">
          <button
            v-for="r in recipes"
            :key="r.id"
            class="recipe-item"
            :class="[
              recipeColor(skill.level, r.level),
              { active: r.id === selectedRecipe }
            ]"
            @click="emit('selectRecipe', r.id)"
            :title="r.level > skill.level ? 'Nível necessário: ' + r.level : r.desc"
          >
            <span class="recipe-color-dot" :style="{ background: colorMap[recipeColor(skill.level, r.level)] }"></span>
            <span class="r-icon">{{ r.icon }}</span>
            <span class="r-name">{{ r.name }}</span>
            <span class="r-level">{{ r.level }}</span>
          </button>
        </div>
      </div>

      <div class="recipe-detail">
        <Transition name="detail" mode="out-in">
          <div :key="activeRecipe.id" class="detail-content">
            <div class="detail-icon">
              <span>{{ activeRecipe.icon }}</span>
            </div>
            <div class="detail-name">{{ activeRecipe.name }}</div>
            <div class="detail-desc">{{ activeRecipe.desc }}</div>

            <div class="detail-stats">
              <div class="stat-row">
                <span>Nível Necessário</span>
                <span :style="{ color: skill.level >= activeRecipe.level ? '#00ff9f' : '#ff3860' }">{{ activeRecipe.level }}</span>
              </div>
              <div class="stat-row">
                <span>XP por ação</span>
                <span style="color: #ffd700">{{ activeRecipe.xp }}</span>
              </div>
              <div v-if="'chance' in activeRecipe" class="stat-row">
                <span>Chance de sucesso</span>
                <span style="color: #00f0ff">{{ Math.floor(activeRecipe.chance * 100) }}%</span>
              </div>
              <div class="stat-row">
                <span>Tempo</span>
                <span style="color: #ffd700">{{ (activeRecipe.duration / 1000).toFixed(1) }}s</span>
              </div>
              <div class="stat-row">
                <span>Produz</span>
                <span style="color: #00ff9f">{{ activeRecipe.minGain }}{{ activeRecipe.maxGain > activeRecipe.minGain ? '-' + activeRecipe.maxGain : '' }} {{ activeRecipe.resource }}</span>
              </div>
            </div>

            <div v-if="Object.keys(activeRecipe.cost).length > 0" class="detail-cost">
              <div class="cost-title">Custo</div>
              <div
                v-for="(amount, item) in activeRecipe.cost"
                :key="item"
                class="cost-row"
                :class="{ insufficient: (inventory[item] || 0) < amount }"
              >
                <span>{{ item === 'logs' ? '🪓 Madeira' : item === 'ores' ? '⛏️ Minério' : item === 'fish' ? '🎣 Peixe' : item }}</span>
                <span>{{ inventory[item] || 0 }} / {{ amount }}</span>
              </div>
            </div>

            <button
              class="craft-btn"
              :class="{ crafting: isCrafting }"
              :disabled="isIdle || anyBusy || recipeColor(skill.level, activeRecipe.level) === 'locked'"
              @click="emit('action', activeRecipe)"
            >
              <span v-if="!isCrafting">⚒️</span>
              <span v-else class="craft-spinner">⏳</span>
              <Transition name="flash" mode="out-in">
                <span :key="isCrafting ? 'craft-' + (currentCraftRecipe ? currentCraftRecipe.id : '') : 'done-' + craftFlash">{{ isCrafting && currentCraftRecipe ? currentCraftRecipe.name : activeRecipe.name }}</span>
              </Transition>
              <span v-if="isCrafting" class="craft-pct">{{ Math.floor(craftProgress) }}%</span>
              <div v-if="isCrafting" class="craft-progress-bar">
                <div class="craft-progress-fill" :style="{ width: craftProgress + '%' }"></div>
              </div>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tradeskill-frame {
  background: linear-gradient(180deg, #1a1210 0%, #0f0a08 100%);
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

.tradeskill-body {
  display: grid;
  grid-template-columns: 180px 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.skill-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  overflow-y: auto;
  border-right: 1px solid rgba(107, 76, 42, 0.3);
  scrollbar-width: thin;
  scrollbar-color: #6b4c2a rgba(0,0,0,0.3);
}

.skill-sidebar::-webkit-scrollbar {
  width: 5px;
}
.skill-sidebar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3);
}
.skill-sidebar::-webkit-scrollbar-thumb {
  background: #6b4c2a;
  border-radius: 2px;
}

.skills-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prof-btn {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  gap: 1px 8px;
  background: rgba(60, 40, 25, 0.3);
  border: 1px solid rgba(107, 76, 42, 0.3);
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  color: #c0a88a;
  font-family: 'Outfit', sans-serif;
  width: 100%;
}

.prof-btn:hover {
  background: rgba(80, 55, 35, 0.5);
  border-color: #8b6b3a;
  box-shadow: inset 0 0 12px rgba(139, 107, 58, 0.15);
}

.prof-btn.active {
  background: rgba(100, 70, 40, 0.4);
  border-color: #ffd700;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.08), 0 0 6px rgba(255, 215, 0, 0.1);
}

.prof-icon {
  grid-row: 1 / 3;
  font-size: 1.2rem;
  align-self: center;
}

.prof-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prof-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #e0d0b8;
}

.prof-level {
  font-size: 0.65rem;
  color: #8b7355;
  font-weight: 500;
}

.prof-bar-bg {
  grid-column: 2;
  height: 3px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(107, 76, 42, 0.3);
}

.prof-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.inventory-box {
  border: 1px solid rgba(107, 76, 42, 0.3);
  background: rgba(30, 20, 15, 0.5);
  border-radius: 4px;
  padding: 6px;
}

.inv-title {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8b7355;
  margin-bottom: 4px;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(107, 76, 42, 0.2);
}

.inv-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inv-row {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  gap: 4px;
  align-items: center;
  font-size: 0.72rem;
  color: #c0a88a;
}

.inv-name {
  color: #8b7355;
}

.inv-qty {
  font-weight: 700;
  color: #e0d0b8;
  background: rgba(0,0,0,0.4);
  padding: 1px 5px;
  border-radius: 8px;
  font-size: 0.7rem;
  min-width: 18px;
  text-align: center;
}

.recipe-list {
  border-right: 1px solid rgba(107, 76, 42, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.list-header {
  padding: 8px 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8b7355;
  border-bottom: 1px solid rgba(107, 76, 42, 0.2);
  background: rgba(0,0,0,0.2);
}

.list-scroll {
  flex: 1;
  overflow-y: scroll;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recipe-item {
  display: grid;
  grid-template-columns: 8px 20px 1fr auto;
  gap: 6px;
  align-items: center;
  padding: 6px 8px;
  background: rgba(60, 40, 25, 0.15);
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  color: #c0a88a;
  font-family: 'Outfit', sans-serif;
  font-size: 0.78rem;
  text-align: left;
  transition: all 0.15s ease;
}

.recipe-item:hover {
  background: rgba(80, 55, 35, 0.3);
  border-color: rgba(107, 76, 42, 0.4);
}

.recipe-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recipe-item:disabled:hover {
  background: rgba(60, 40, 25, 0.15);
  border-color: transparent;
}

.recipe-item.active {
  background: rgba(100, 70, 40, 0.3);
  border-color: #ffd700;
}

.recipe-item.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.recipe-color-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.r-icon { font-size: 1rem; }
.r-name { font-weight: 500; }
.r-level { font-size: 0.7rem; color: #665544; }

.recipe-detail {
  padding: clamp(8px, 1.2vw, 16px);
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.6vw, 8px);
  overflow-y: scroll;
  box-sizing: border-box;
  min-width: 0;
}

.detail-icon {
  font-size: 2rem;
  text-align: center;
  padding: 6px;
  background: rgba(60, 40, 25, 0.2);
  border: 1px solid rgba(107, 76, 42, 0.3);
  border-radius: 6px;
  width: 50px;
  margin: 0 auto;
  flex-shrink: 0;
}

.detail-name {
  text-align: center;
  font-size: 0.95rem;
  font-weight: 700;
  color: #e0d0b8;
  flex-shrink: 0;
}

.detail-desc {
  font-size: 0.75rem;
  color: #8b7355;
  text-align: center;
  line-height: 1.3;
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

.detail-cost {
  background: rgba(40, 25, 15, 0.4);
  border: 1px solid rgba(107, 76, 42, 0.2);
  border-radius: 4px;
  padding: 6px 10px;
  flex-shrink: 0;
}

.cost-title {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8b7355;
  margin-bottom: 3px;
}

.cost-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #c0a88a;
  padding: 1px 0;
}

.cost-row.insufficient {
  color: #ff3860;
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

.craft-btn:active:not(:disabled) {
  transform: translateY(1px);
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
  background: #ffd700;
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
  transition: width 0.1s linear;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.6vw, 8px);
}

.detail-enter-active,
.detail-leave-active {
  transition: all 0.2s ease;
}
.detail-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.detail-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.flash-enter-active {
  transition: all 0.15s ease-out;
}
.flash-leave-active {
  transition: all 0.1s ease-in;
}
.flash-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.flash-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.list-scroll::-webkit-scrollbar,
.recipe-detail::-webkit-scrollbar {
  width: 5px;
}

.list-scroll::-webkit-scrollbar-track,
.recipe-detail::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3);
}

.list-scroll::-webkit-scrollbar-thumb,
.recipe-detail::-webkit-scrollbar-thumb {
  background: #6b4c2a;
  border-radius: 2px;
}

.list-scroll,
.recipe-detail {
  scrollbar-width: thin;
  scrollbar-color: #6b4c2a rgba(0,0,0,0.3);
}
</style>
