<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  ARMOR_PIECES: Array,
  ARMOR_SLOTS: Array,
  craftedArmor: Array,
  equipped: Object,
  armorFragments: Number,
  activeBonuses: Object,
  canCraftArmor: Function,
  executeCraftArmor: Function,
  cancelArmorCraft: Function,
  isCraftingArmor: Boolean,
  armorCraftProgress: Number,
  anyBusy: Boolean,
  equipArmor: Function,
  unequipArmor: Function,
  activeTab: String,
  tabOrder: Array,
  TAB_DEFS: Object,
  isIdle: Boolean,
  timerProgress: Number,
  autoplaySkill: String,
  currentAutoplayRecipe: Object,
})

const emit = defineEmits(['setTab', 'dragStart', 'dragOver', 'dragEnd', 'toggleIdle'])

const slotLabels = { head: 'Cabeça', chest: 'Peito', legs: 'Pernas', feet: 'Pés', weapon: 'Arma' }
const slotIcons = { head: '🪖', chest: '🛡️', legs: '👖', feet: '👢', weapon: '🗡️' }

const selectedSlot = ref(null)

const availablePieces = computed(() =>
  props.ARMOR_PIECES.filter(p => !selectedSlot.value || p.slot === selectedSlot.value)
)

function bonusText(bonuses) {
  const parts = []
  if (bonuses.xpMult) parts.push(`+${Math.round((bonuses.xpMult - 1) * 100)}% XP`)
  if (bonuses.speedMult) parts.push(`-${Math.round((1 - bonuses.speedMult) * 100)}% Tempo`)
  if (bonuses.successBonus) parts.push(`+${Math.round(bonuses.successBonus * 100)}% Sucesso`)
  return parts.join(', ')
}

function totalBonusText(bonuses) {
  const parts = []
  if (bonuses.xpMult !== 1) parts.push(`XP: x${bonuses.xpMult.toFixed(2)}`)
  if (bonuses.speedMult !== 1) parts.push(`Tempo: x${bonuses.speedMult.toFixed(2)}`)
  if (bonuses.successBonus !== 0) parts.push(`Sucesso: +${Math.round(bonuses.successBonus * 100)}%`)
  return parts
}
</script>

<template>
  <div class="tradeskill-frame">
    <div class="tradeskill-title-bar">
      <span class="tradeskill-title">🛡️ Armadura</span>
      <div class="title-bar-right">
        <div class="autoplay-toggle" @click="emit('toggleIdle')" :title="isIdle ? 'Desativar Automático' : 'Ativar Automático'">
          <span class="autoplay-icon">⚡</span>
          <span class="autoplay-status" :class="{ active: isIdle }">{{ isIdle ? 'ON' : 'OFF' }}</span>
          <span v-if="isIdle" class="autoplay-target">{{ TAB_DEFS[activeTab].icon }} {{ TAB_DEFS[activeTab].label }}</span>
        </div>
        <span class="tradeskill-level">🔮 {{ armorFragments }} Fragmentos</span>
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

    <div class="equip-body">
      <div class="equip-slots">
        <div class="list-header">Equipados</div>
        <div class="slots-grid">
          <div
            v-for="slot in ARMOR_SLOTS"
            :key="slot"
            class="slot-card"
            :class="{ active: selectedSlot === slot, disabled: anyBusy }"
            @click="selectedSlot = slot"
          >
            <div class="slot-icon">{{ equipped[slot] ? equipped[slot].icon : slotIcons[slot] }}</div>
            <div class="slot-name">{{ slotLabels[slot] }}</div>
            <div v-if="equipped[slot]" class="slot-item">
              <span class="item-name">{{ equipped[slot].name }}</span>
              <span class="item-tier">{{ '★'.repeat(equipped[slot].tier) }}</span>
            </div>
            <div v-else class="slot-empty">Vazio</div>
            <button
              v-if="equipped[slot]"
              class="unequip-btn"
              :disabled="anyBusy"
              @click.stop="unequipArmor(slot)"
            >Desequipar</button>
          </div>
        </div>

        <div class="bonuses-display">
          <div class="list-header">Bônus Ativos</div>
          <div class="bonus-row" v-for="b in totalBonusText(activeBonuses)" :key="b">
            <span class="bonus-tag">✅ {{ b }}</span>
          </div>
          <div v-if="totalBonusText(activeBonuses).length === 0" class="bonus-empty">
            Nenhum bônus ativo. Equipe armaduras para ganhar benefícios!
          </div>
        </div>
      </div>

      <div class="equip-list">
        <div class="list-header">
          Peças
          <span class="list-hint">(clique num slot para filtrar)</span>
        </div>
        <div class="equip-scroll">
          <div
            v-for="piece in availablePieces"
            :key="piece.id"
            class="armor-card"
            :class="{
              crafted: craftedArmor.includes(piece.id),
              equipped: equipped[piece.slot] && equipped[piece.slot].id === piece.id,
              locked: !canCraftArmor(piece) && !craftedArmor.includes(piece.id),
            }"
          >
            <div class="armor-icon">{{ piece.icon }}</div>
            <div class="armor-info">
              <div class="armor-name">{{ piece.name }}</div>
              <div class="armor-slot">{{ slotLabels[piece.slot] }} • {{ '★'.repeat(piece.tier) }}</div>
              <div class="armor-bonus">{{ bonusText(piece.bonuses) }}</div>
            </div>
            <div v-if="craftedArmor.includes(piece.id) && (!equipped[piece.slot] || equipped[piece.slot].id !== piece.id)"
              class="armor-action"
            >
              <button class="equip-btn" :disabled="anyBusy" @click="equipArmor(piece.id)">Equipar</button>
            </div>
            <div v-else-if="equipped[piece.slot] && equipped[piece.slot].id === piece.id"
              class="armor-status equipped-label"
            >✅</div>
            <div v-else class="armor-cost">
              <span>🔮 {{ piece.cost }}</span>
              <button
                v-if="isCraftingArmor"
                class="craft-armor-btn crafting"
                disabled
              >⏳ {{ Math.floor(armorCraftProgress) }}%</button>
              <button
                v-else
                class="craft-armor-btn"
                :disabled="!canCraftArmor(piece)"
                @click="executeCraftArmor(piece)"
              >Criar</button>
            </div>
          </div>
        </div>
        <div v-if="isCraftingArmor" class="armor-craft-progress">
          <div class="armor-craft-progress-fill" :style="{ width: armorCraftProgress + '%' }"></div>
        </div>
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

.equip-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.equip-slots {
  border-right: 1px solid rgba(107, 76, 42, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 6px;
  gap: 4px;
}

.slots-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-card {
  background: rgba(60, 40, 25, 0.15);
  border: 1px solid rgba(107, 76, 42, 0.3);
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 6px;
  align-items: center;
  transition: all 0.15s ease;
}

.slot-card:hover {
  background: rgba(80, 55, 35, 0.3);
  border-color: rgba(139, 107, 58, 0.5);
}

.slot-card.active {
  border-color: #ffd700;
  background: rgba(100, 70, 40, 0.3);
  box-shadow: inset 0 0 8px rgba(255, 215, 0, 0.08);
}

.slot-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slot-icon { font-size: 1.1rem; }
.slot-name { font-size: 0.72rem; color: #8b7355; }
.slot-item { font-size: 0.75rem; display: flex; gap: 4px; align-items: center; }
.item-name { color: #e0d0b8; font-weight: 600; }
.item-tier { color: #ffd700; font-size: 0.65rem; }
.slot-empty { font-size: 0.7rem; color: #554433; font-style: italic; }
.unequip-btn {
  font-size: 0.6rem;
  padding: 2px 6px;
  background: rgba(80, 30, 30, 0.4);
  border: 1px solid #553333;
  border-radius: 3px;
  color: #cc6666;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
}
.unequip-btn:hover {
  background: rgba(120, 40, 40, 0.5);
}

.unequip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bonuses-display {
  margin-top: auto;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(107, 76, 42, 0.2);
  border-radius: 4px;
  padding: 6px 8px;
}

.bonus-row {
  font-size: 0.7rem;
  padding: 2px 0;
}

.bonus-tag {
  color: #00ff9f;
}

.bonus-empty {
  font-size: 0.7rem;
  color: #554433;
  font-style: italic;
}

.equip-list {
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.list-hint {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #665544;
}

.equip-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.armor-card {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 6px;
  align-items: center;
  padding: 6px 8px;
  background: rgba(60, 40, 25, 0.15);
  border: 1px solid transparent;
  border-radius: 4px;
}

.armor-card.crafted {
  border-color: rgba(0, 255, 159, 0.2);
  background: rgba(0, 255, 159, 0.05);
}

.armor-card.equipped {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.08);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.1);
}

.armor-card.locked {
  opacity: 0.4;
}

.armor-icon { font-size: 1.3rem; }
.armor-info { display: flex; flex-direction: column; gap: 1px; }
.armor-name { font-size: 0.78rem; font-weight: 600; color: #e0d0b8; }
.armor-slot { font-size: 0.65rem; color: #8b7355; }
.armor-bonus { font-size: 0.65rem; color: #00f0ff; }

.armor-cost {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 0.7rem;
  color: #8b7355;
}

.craft-armor-btn {
  font-size: 0.65rem;
  padding: 3px 10px;
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  border: 1px solid #8b6b3a;
  border-radius: 3px;
  color: #ffd700;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.craft-armor-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #5a3d25, #3d2817);
}

.craft-armor-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.craft-armor-btn.crafting {
  background: linear-gradient(180deg, #2a3d17, #1a2a0e);
  border-color: #6b8b3a;
  opacity: 1;
  cursor: wait;
}

.armor-craft-progress {
  height: 3px;
  background: rgba(0,0,0,0.4);
  overflow: hidden;
}

.armor-craft-progress-fill {
  height: 100%;
  background: #ffd700;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
  transition: width 0.1s linear;
}

.armor-action {
  display: flex;
  align-items: center;
}

.equip-btn {
  font-size: 0.65rem;
  padding: 3px 10px;
  background: linear-gradient(180deg, #1a3d1a, #0e2a0e);
  border: 1px solid #3a8b3a;
  border-radius: 3px;
  color: #00ff9f;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
}

.equip-btn:hover {
  background: linear-gradient(180deg, #2a5a2a, #1a3d1a);
}

.equipped-label {
  font-size: 1.1rem;
}

.equip-scroll::-webkit-scrollbar {
  width: 5px;
}
.equip-scroll::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.3);
}
.equip-scroll::-webkit-scrollbar-thumb {
  background: #6b4c2a;
  border-radius: 2px;
}

.equip-scroll {
  scrollbar-width: thin;
  scrollbar-color: #6b4c2a rgba(0,0,0,0.3);
}
</style>
