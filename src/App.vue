<script setup>
import { ref, computed, watch } from 'vue'
import { useGameState } from './composables/useGameState.js'
import LoadingScreen from './components/LoadingScreen.vue'
import SkillPanel from './components/SkillPanel.vue'
import EquipmentPanel from './components/EquipmentPanel.vue'
import PvMPanel from './components/PvMPanel.vue'
import ConsolePanel from './components/ConsolePanel.vue'
import AuthModal from './components/AuthModal.vue'
import { supabase } from './supabase'

const {
  skills, inventory, logs, RECIPES, recipeColor,
  selectedSkill, selectedRecipe, timerProgress,
  isIdle, isCrafting, craftProgress, craftFlash, autoplaySkill, currentAutoplayRecipe, currentCraftRecipe,
  anyBusy, isCraftingArmor, armorCraftProgress,
  armorFragments, equipped, craftedArmor, activeTab, ARMOR_PIECES, ARMOR_SLOTS, activeBonuses,
  selectedMonster, isFighting, fightProgress, powerLevel, currentMonster, MONSTERS,
  fightSuccessChance, startFight, cancelFight, selectMonster,
  selectSkill, selectRecipe, executeAction, toggleIdle, cancelCraft, cancelArmorCraft,
  canCraftArmor, executeCraftArmor, equipArmor, unequipArmor,
  user, session, isCloudLoading, lastCloudSaveTime, saveGame
} = useGameState()

const isAuthModalOpen = ref(false)
const guestMode = ref(false)

const isGateActive = computed(() => !user.value && !guestMode.value)

const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.username || user.value.user_metadata?.full_name || user.value.user_metadata?.name || user.value.email.split('@')[0]
})

watch(user, (newUser) => {
  if (newUser) {
    guestMode.value = false
  }
})

async function triggerLogout() {
  await saveGame(true)
  await supabase.auth.signOut()
  isAuthModalOpen.value = false
}

const skillList = [
  { id: 'woodcutting', icon: '🪓', color: '#00ff9f' },
  { id: 'mining', icon: '⛏️', color: '#ffd700' },
  { id: 'fishing', icon: '🎣', color: '#00f0ff' },
  { id: 'cooking', icon: '🍳', color: '#ff8866' },
]

const totalLevel = computed(() => {
  let total = 0
  for (const s of Object.values(skills)) total += s.level
  return total
})

const TAB_DEFS = {
  profession: { icon: '⚒️', label: 'Profissão' },
  pvm: { icon: '⚔️', label: 'PvM' },
  equipment: { icon: '🛡️', label: 'Equipamento' },
}

const defaultOrder = ['profession', 'pvm', 'equipment']
const stored = localStorage.getItem('tab_order')
const tabOrder = ref(stored ? JSON.parse(stored) : [...defaultOrder])

let dragId = null

function onDragStart(id) { dragId = id }

function onDragOver(e, id) {
  e.preventDefault()
  if (dragId === id) return
  const from = tabOrder.value.indexOf(dragId)
  const to = tabOrder.value.indexOf(id)
  if (from === -1 || to === -1) return
  tabOrder.value.splice(from, 1)
  tabOrder.value.splice(to, 0, dragId)
}

function onDragEnd() {
  localStorage.setItem('tab_order', JSON.stringify(tabOrder.value))
  dragId = null
}
</script>

<template>
  <LoadingScreen />

  <div class="game-container">
    <header class="char-header">
      <div class="char-portrait">
        <span class="char-avatar">🧙</span>
      </div>
      <div class="char-info">
        <span class="char-name">Aventureiro</span>
        <span class="char-total">Level Total: {{ totalLevel }}</span>
      </div>
      <div class="char-skills">
        <div v-for="s in skillList" :key="s.id" class="char-skill">
          <span class="cs-icon">{{ s.icon }}</span>
          <span class="cs-level" :style="{ color: s.color }">{{ skills[s.id].level }}</span>
        </div>
      </div>
      <div class="char-frags">
        <span>🔮 {{ armorFragments }}</span>
      </div>
      <button class="account-btn" @click="isAuthModalOpen = true">
        <span v-if="user">🛡️ {{ displayName }}</span>
        <span v-else>⚔️ Conta</span>
      </button>
    </header>

    <main class="main-panel">
      <SkillPanel
        v-show="activeTab === 'profession'"
        :skills="skills"
        :RECIPES="RECIPES"
        :selectedSkill="selectedSkill"
        :selectedRecipe="selectedRecipe"
        :isIdle="isIdle"
        :isCrafting="isCrafting"
        :craftProgress="craftProgress"
        :inventory="inventory"
        :recipeColor="recipeColor"
        :craftFlash="craftFlash"
        :autoplaySkill="autoplaySkill"
        :activeTab="activeTab"
        :tabOrder="tabOrder"
        :TAB_DEFS="TAB_DEFS"
        :timerProgress="timerProgress"
        :currentAutoplayRecipe="currentAutoplayRecipe"
        :currentCraftRecipe="currentCraftRecipe"
        :anyBusy="anyBusy"
        @selectRecipe="selectRecipe"
        @selectSkill="selectSkill"
        @action="executeAction"
        @toggleIdle="toggleIdle"
        @setTab="id => activeTab = id"
        @dragStart="onDragStart"
        @dragOver="onDragOver"
        @dragEnd="onDragEnd"
      />

      <PvMPanel
        v-show="activeTab === 'pvm'"
        :MONSTERS="MONSTERS"
        :selectedMonster="selectedMonster"
        :isFighting="isFighting"
        :fightProgress="fightProgress"
        :powerLevel="powerLevel"
        :currentMonster="currentMonster"
        :fightSuccessChance="fightSuccessChance"
        :startFight="startFight"
        :selectMonster="selectMonster"
        :activeTab="activeTab"
        :tabOrder="tabOrder"
        :TAB_DEFS="TAB_DEFS"
        :isIdle="isIdle"
        :timerProgress="timerProgress"
        :autoplaySkill="autoplaySkill"
        :currentAutoplayRecipe="currentAutoplayRecipe"
        :armorFragments="armorFragments"
        :anyBusy="anyBusy"
        @setTab="id => activeTab = id"
        @dragStart="onDragStart"
        @dragOver="onDragOver"
        @dragEnd="onDragEnd"
        @toggleIdle="toggleIdle"
      />

      <EquipmentPanel
        v-show="activeTab === 'equipment'"
        :ARMOR_PIECES="ARMOR_PIECES"
        :ARMOR_SLOTS="ARMOR_SLOTS"
        :craftedArmor="craftedArmor"
        :equipped="equipped"
        :armorFragments="armorFragments"
        :activeBonuses="activeBonuses"
        :canCraftArmor="canCraftArmor"
        :executeCraftArmor="executeCraftArmor"
        :cancelArmorCraft="cancelArmorCraft"
        :isCraftingArmor="isCraftingArmor"
        :armorCraftProgress="armorCraftProgress"
        :anyBusy="anyBusy"
        :equipArmor="equipArmor"
        :unequipArmor="unequipArmor"
        :activeTab="activeTab"
        :tabOrder="tabOrder"
        :TAB_DEFS="TAB_DEFS"
        :isIdle="isIdle"
        :timerProgress="timerProgress"
        :autoplaySkill="autoplaySkill"
        :currentAutoplayRecipe="currentAutoplayRecipe"
        @setTab="id => activeTab = id"
        @dragStart="onDragStart"
        @dragOver="onDragOver"
        @dragEnd="onDragEnd"
        @toggleIdle="toggleIdle"
      />

      <ConsolePanel :logs="logs" />
    </main>
  </div>

  <AuthModal
    :isOpen="isAuthModalOpen || isGateActive"
    :isGateMode="isGateActive"
    :user="user"
    :lastCloudSaveTime="lastCloudSaveTime"
    :isCloudLoading="isCloudLoading"
    @close="isAuthModalOpen = false"
    @manualSync="saveGame(true)"
    @playOffline="guestMode = true"
    @logout="triggerLogout"
  />
</template>

<style>
/* Global game container overwrite for WoW theme */
.game-container {
  width: 95%;
  max-width: 1200px;
  min-width: 700px;
  height: min(85vh, 700px);
  min-height: 480px;
  background: rgba(10, 6, 4, 0.85);
  border: 2px solid #6b4c2a;
  border-radius: 8px;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), inset 0 0 30px rgba(0,0,0,0.5);
  padding: clamp(12px, 2vw, 24px);
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1vw, 12px);
  position: relative;
  overflow: hidden;
}

.char-header {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  background: linear-gradient(180deg, rgba(61, 40, 23, 0.5), rgba(42, 26, 14, 0.3));
  border: 1px solid rgba(107, 76, 42, 0.4);
  border-radius: 6px;
  padding: clamp(6px, 1vw, 10px) clamp(10px, 1.5vw, 16px);
  flex-shrink: 0;
}

.char-portrait {
  width: 40px;
  height: 40px;
  border: 2px solid #8b6b3a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  flex-shrink: 0;
}

.char-avatar {
  font-size: 1.3rem;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.3));
}

.char-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex-shrink: 0;
}

.char-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.char-total {
  font-size: 0.65rem;
  color: #8b7355;
}

.char-skills {
  display: flex;
  gap: clamp(6px, 1vw, 12px);
  margin-left: auto;
}

.char-skill {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(0,0,0,0.3);
  padding: 2px 8px;
  border: 1px solid rgba(107, 76, 42, 0.3);
  border-radius: 4px;
}

.cs-icon { font-size: 0.9rem; }
.cs-level { font-size: 0.75rem; font-weight: 700; }

.char-frags {
  font-size: 0.8rem;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.2);
  background: rgba(0,0,0,0.3);
  padding: 4px 10px;
  border: 1px solid rgba(107, 76, 42, 0.3);
  border-radius: 4px;
  flex-shrink: 0;
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: clamp(4px, 0.8vw, 10px);
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

/* WoW ornamental frame decorations */
.tradeskill-frame::before,
.tradeskill-frame::after {
  content: '◆';
  position: absolute;
  font-size: 0.5rem;
  color: #8b6b3a;
  pointer-events: none;
  z-index: 1;
}
.tradeskill-frame::before {
  top: 3px;
  left: 6px;
}
.tradeskill-frame::after {
  top: 3px;
  right: 6px;
}

.tradeskill-frame {
  position: relative;
}

/* Pulsing glow for progress bars */
@keyframes progress-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.craft-progress-fill,
.armor-craft-progress-fill {
  animation: progress-glow 1.5s ease-in-out infinite;
}

/* Level-up flash effect */
@keyframes level-up-glow {
  0% { text-shadow: 0 0 0 rgba(255, 215, 0, 0); }
  50% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4); }
  100% { text-shadow: 0 0 0 rgba(255, 215, 0, 0); }
}

.account-btn {
  background: linear-gradient(180deg, #8b6b3a, #5c4220);
  border: 2px solid #ffd700;
  color: #fff;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
}
.account-btn:hover {
  background: linear-gradient(180deg, #a68146, #70522a);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}
</style>
