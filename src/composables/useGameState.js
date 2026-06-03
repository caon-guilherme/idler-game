import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabase'


const SAVE_KEY = 'rpg_idle_save'
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

function createSkill(name, icon, color) {
  const level = ref(0)
  const xp = ref(0)
  const maxXp = ref(30)
  const xpProgress = computed(() => (xp.value / maxXp.value) * 100)

  function addXp(amount) {
    xp.value += amount
    if (xp.value >= maxXp.value) {
      xp.value -= maxXp.value
      level.value += 1
      maxXp.value = Math.floor(maxXp.value * 1.3)
      return true
    }
    return false
  }

  return { name, icon, color, level, xp, maxXp, xpProgress, addXp }
}

const RECIPES = {
  woodcutting: [
    { id: 'simple', name: 'Corte Simples', level: 1, icon: '🪵', desc: 'Corte árvores comuns para obter madeira.', minGain: 1, maxGain: 2, xp: 10, resource: 'logs', cost: {}, duration: 6000 },
    { id: 'robust', name: 'Corte Robusto', level: 5, icon: '🌲', desc: 'Corte árvores grossas para obter mais madeira.', minGain: 3, maxGain: 5, xp: 20, resource: 'logs', cost: {}, duration: 7500 },
    { id: 'master', name: 'Corte de Mestre', level: 10, icon: '🌳', desc: 'Derrube árvores antigas com precisão.', minGain: 5, maxGain: 8, xp: 32, resource: 'logs', cost: {}, duration: 9000 },
    { id: 'epic', name: 'Corte Épico', level: 20, icon: '🏆', desc: 'Corte madeira encantada de florestas ancestrais.', minGain: 8, maxGain: 12, xp: 45, resource: 'logs', cost: {}, duration: 10000 },
  ],
  mining: [
    { id: 'copper', name: 'Minério de Cobre', level: 1, icon: '🪨', desc: 'Mine veios de cobre para obter minério.', minGain: 1, maxGain: 2, xp: 12, resource: 'ores', cost: {}, duration: 6600 },
    { id: 'iron', name: 'Minério de Ferro', level: 5, icon: '⛓️', desc: 'Mine veios de ferro mais densos.', minGain: 2, maxGain: 4, xp: 23, resource: 'ores', cost: {}, duration: 8000 },
    { id: 'gold', name: 'Minério de Ouro', level: 10, icon: '💎', desc: 'Encontre veios de ouro raros.', minGain: 4, maxGain: 6, xp: 35, resource: 'ores', cost: {}, duration: 9600 },
    { id: 'mithril', name: 'Minério de Mitril', level: 20, icon: '🔮', desc: 'Mine o lendário mitril das profundezas.', minGain: 6, maxGain: 10, xp: 50, resource: 'ores', cost: {}, duration: 11000 },
  ],
  fishing: [
    { id: 'river', name: 'Pesca em Rio', level: 1, icon: '🌊', desc: 'Pesque em rios calmos.', minGain: 1, maxGain: 1, xp: 8, resource: 'fish', cost: {}, chance: 0.65, duration: 7500 },
    { id: 'lake', name: 'Pesca em Lago', level: 5, icon: '🏞️', desc: 'Pesque em lagos profundos.', minGain: 1, maxGain: 2, xp: 16, resource: 'fish', cost: {}, chance: 0.75, duration: 9000 },
    { id: 'sea', name: 'Pesca no Mar', level: 10, icon: '🌅', desc: 'Pesque em águas oceânicas.', minGain: 2, maxGain: 4, xp: 27, resource: 'fish', cost: {}, chance: 0.85, duration: 10000 },
    { id: 'mystic', name: 'Águas Místicas', level: 20, icon: '🌌', desc: 'Pesque em águas encantadas.', minGain: 3, maxGain: 6, xp: 40, resource: 'fish', cost: {}, chance: 0.95, duration: 12000 },
  ],
  cooking: [
    { id: 'grilled', name: 'Peixe Grelhado', level: 1, icon: '🍽️', desc: 'Grelhe um peixe simples.', minGain: 1, maxGain: 1, xp: 18, resource: 'food', cost: { fish: 1 }, duration: 9000 },
    { id: 'soup', name: 'Sopa de Peixe', level: 5, icon: '🥣', desc: 'Cozinhe uma sopa nutritiva.', minGain: 2, maxGain: 2, xp: 28, resource: 'food', cost: { fish: 1, logs: 1 }, duration: 10000 },
    { id: 'feast', name: 'Banquete do Mestre', level: 10, icon: '🍖', desc: 'Prepare um banquete para heróis.', minGain: 4, maxGain: 4, xp: 42, resource: 'food', cost: { fish: 2, logs: 2 }, duration: 12000 },
    { id: 'epicfeast', name: 'Festim Épico', level: 20, icon: '🎉', desc: 'Cozinhe o festim dos campeões.', minGain: 7, maxGain: 7, xp: 62, resource: 'food', cost: { fish: 3, logs: 3, ores: 1 }, duration: 15000 },
  ],
}

const ARMOR_SLOTS = ['head', 'chest', 'legs', 'feet', 'weapon']

const MONSTERS = [
  { id: 'slime', name: 'Slime', icon: '🟢', level: 1, minFrags: 1, maxFrags: 2, desc: 'Uma gosma inofensiva.' },
  { id: 'goblin', name: 'Goblin', icon: '👺', level: 5, minFrags: 2, maxFrags: 4, desc: 'Pequeno e traiçoeiro.' },
  { id: 'skeleton', name: 'Esqueleto', icon: '💀', level: 10, minFrags: 4, maxFrags: 6, desc: 'Morto-vivo armado.' },
  { id: 'troll', name: 'Troll', icon: '👹', level: 15, minFrags: 6, maxFrags: 8, desc: 'Grande e resistente.' },
  { id: 'dragon', name: 'Dragão', icon: '🐉', level: 20, minFrags: 8, maxFrags: 12, desc: 'A maior ameaça.' },
]

const ARMOR_PIECES = [
  { id: 'leather_helm', name: 'Capacete de Couro', slot: 'head', icon: '🪖', cost: 10, tier: 1, bonuses: { xpMult: 1.05 } },
  { id: 'iron_helm', name: 'Elmo de Ferro', slot: 'head', icon: '⛑️', cost: 25, tier: 2, bonuses: { xpMult: 1.1 } },
  { id: 'mithril_helm', name: 'Coroa de Mitril', slot: 'head', icon: '👑', cost: 50, tier: 3, bonuses: { xpMult: 1.15 } },
  { id: 'legendary_helm', name: 'Coroa Lendária', slot: 'head', icon: '🌟', cost: 100, tier: 4, bonuses: { xpMult: 1.25 } },

  { id: 'leather_chest', name: 'Armadura de Couro', slot: 'chest', icon: '🦺', cost: 15, tier: 1, bonuses: { speedMult: 0.95 } },
  { id: 'iron_chest', name: 'Cota de Ferro', slot: 'chest', icon: '🛡️', cost: 30, tier: 2, bonuses: { speedMult: 0.9 } },
  { id: 'mithril_chest', name: 'Armadura de Mitril', slot: 'chest', icon: '⚔️', cost: 60, tier: 3, bonuses: { speedMult: 0.85 } },
  { id: 'legendary_chest', name: 'Armadura Lendária', slot: 'chest', icon: '✨', cost: 120, tier: 4, bonuses: { speedMult: 0.75 } },

  { id: 'leather_legs', name: 'Calças de Couro', slot: 'legs', icon: '👖', cost: 8, tier: 1, bonuses: { successBonus: 0.05 } },
  { id: 'iron_legs', name: 'Grevas de Ferro', slot: 'legs', icon: '🦿', cost: 20, tier: 2, bonuses: { successBonus: 0.1 } },
  { id: 'mithril_legs', name: 'Grevas de Mitril', slot: 'legs', icon: '💪', cost: 40, tier: 3, bonuses: { successBonus: 0.15 } },
  { id: 'legendary_legs', name: 'Grevas Lendárias', slot: 'legs', icon: '🏅', cost: 80, tier: 4, bonuses: { successBonus: 0.2 } },

  { id: 'leather_boots', name: 'Botas de Couro', slot: 'feet', icon: '👞', cost: 8, tier: 1, bonuses: { xpMult: 1.03 } },
  { id: 'iron_boots', name: 'Botas de Ferro', slot: 'feet', icon: '🥾', cost: 20, tier: 2, bonuses: { xpMult: 1.05, speedMult: 0.97 } },
  { id: 'mithril_boots', name: 'Botas de Mitril', slot: 'feet', icon: '👢', cost: 40, tier: 3, bonuses: { xpMult: 1.08, speedMult: 0.95 } },
  { id: 'legendary_boots', name: 'Botas Lendárias', slot: 'feet', icon: '🔥', cost: 80, tier: 4, bonuses: { xpMult: 1.12, speedMult: 0.92 } },

  { id: 'stone_blade', name: 'Adaga de Pedra', slot: 'weapon', icon: '🗡️', cost: 12, tier: 1, bonuses: { speedMult: 0.97 } },
  { id: 'iron_sword', name: 'Espada de Ferro', slot: 'weapon', icon: '⚔️', cost: 28, tier: 2, bonuses: { speedMult: 0.95, successBonus: 0.03 } },
  { id: 'mithril_axe', name: 'Machado de Mitril', slot: 'weapon', icon: '🪓', cost: 55, tier: 3, bonuses: { speedMult: 0.92, successBonus: 0.05 } },
  { id: 'legendary_blade', name: 'Lâmina Lendária', slot: 'weapon', icon: '🗡️', cost: 110, tier: 4, bonuses: { speedMult: 0.88, successBonus: 0.08 } },
]

function recipeColor(skillLevel, recipeLevel) {
  if (skillLevel < recipeLevel) return 'locked'
  const diff = skillLevel - recipeLevel
  if (diff <= 2) return 'orange'
  if (diff <= 6) return 'yellow'
  if (diff <= 11) return 'green'
  return 'grey'
}

export function useGameState() {
  const skills = reactive({
    woodcutting: createSkill('Woodcutting', '🪓', '#00ff9f'),
    mining: createSkill('Mining', '⛏️', '#ffd700'),
    fishing: createSkill('Fishing', '🎣', '#00f0ff'),
    cooking: createSkill('Cooking', '🍳', '#ff8866'),
  })

  const inventory = ref({ logs: 0, ores: 0, fish: 0, food: 0 })
  const logs = ref([
    { message: 'Bem-vindo ao Idle Craft! Selecione uma profissão e um recipe.', type: 'system' },
  ])

  const selectedSkill = ref('woodcutting')
  const selectedRecipe = ref(RECIPES.woodcutting[0].id)
  const isIdle = ref(false)
  const timerProgress = ref(0)
  const isCrafting = ref(false)
  const craftProgress = ref(0)

  let autoplayTimer = null
  let craftTimer = null
  let armorCraftTimer = null
  const autoplaySkill = ref(null)
  const currentAutoplayRecipe = ref(null)
  const currentCraftRecipe = ref(null)
  const craftFlash = ref(0)
  const armorFragments = ref(0)
  const isCraftingArmor = ref(false)
  const armorCraftProgress = ref(0)
  const anyBusy = computed(() => isCrafting.value || isFighting.value || isCraftingArmor.value)
  const equipped = reactive({
    head: null, chest: null, legs: null, feet: null, weapon: null,
  })
  const craftedArmor = ref([])
  const activeTab = ref('profession')

  const activeBonuses = computed(() => {
    const b = { xpMult: 1, speedMult: 1, successBonus: 0 }
    for (const slot of ARMOR_SLOTS) {
      const piece = equipped[slot]
      if (piece) {
        if (piece.bonuses.xpMult) b.xpMult *= piece.bonuses.xpMult
        if (piece.bonuses.speedMult) b.speedMult *= piece.bonuses.speedMult
        if (piece.bonuses.successBonus) b.successBonus += piece.bonuses.successBonus
      }
    }
    return b
  })

  function canCraftArmor(piece) {
    return armorFragments.value >= piece.cost && !craftedArmor.value.includes(piece.id) && !anyBusy.value
  }

  function cancelArmorCraft() {
    if (armorCraftTimer) { clearInterval(armorCraftTimer); armorCraftTimer = null }
    isCraftingArmor.value = false
    armorCraftProgress.value = 0
  }

  function executeCraftArmor(piece) {
    if (!canCraftArmor(piece)) return
    cancelCraft()
    cancelFight()
    const duration = Math.floor(8000 * activeBonuses.value.speedMult)
    armorFragments.value -= piece.cost
    isCraftingArmor.value = true
    armorCraftProgress.value = 0
    let elapsed = 0
    armorCraftTimer = setInterval(() => {
      elapsed += 50
      armorCraftProgress.value = Math.min(100, (elapsed / duration) * 100)
      if (elapsed >= duration) {
        clearInterval(armorCraftTimer)
        armorCraftTimer = null
        isCraftingArmor.value = false
        armorCraftProgress.value = 0
        craftedArmor.value.push(piece.id)
        addLog(`🔨 ${piece.name} criado!`, 'loot')
      }
    }, 50)
  }

  function equipArmor(pieceId) {
    const piece = ARMOR_PIECES.find(p => p.id === pieceId)
    if (!piece || !craftedArmor.value.includes(pieceId)) return
    equipped[piece.slot] = piece
    addLog(`✅ ${piece.name} equipado.`, 'blessing')
  }

  const slotLabels = { head: 'Cabeça', chest: 'Peito', legs: 'Pernas', feet: 'Pés', weapon: 'Arma' }

  function unequipArmor(slot) {
    equipped[slot] = null
    addLog(`🔄 ${slotLabels[slot] || slot} desequipado.`, 'system')
  }

  const selectedMonster = ref(MONSTERS[0].id)
  const isFighting = ref(false)
  const fightProgress = ref(0)
  let fightTimer = null

  const powerLevel = computed(() => {
    let total = 0
    for (const s of Object.values(skills)) total += s.level
    return Math.floor(total / 4)
  })

  const currentMonster = computed(() => MONSTERS.find(m => m.id === selectedMonster.value) || MONSTERS[0])

  function fightSuccessChance(monster) {
    const diff = powerLevel.value - monster.level
    return Math.min(0.95, Math.max(0.3, 0.5 + diff * 0.04))
  }

  function cancelFight() {
    if (fightTimer) { clearInterval(fightTimer); fightTimer = null }
    isFighting.value = false
    fightProgress.value = 0
  }

  function executeFight(monster) {
    const chance = fightSuccessChance(monster)
    const success = Math.random() < chance
    if (success) {
      const frags = randomInt(monster.minFrags, monster.maxFrags)
      armorFragments.value += frags
      const xpSkill = Object.keys(skills)[Math.floor(Math.random() * 4)]
      const xpGain = Math.floor(monster.level * 3 * (activeBonuses.value.xpMult || 1))
      skills[xpSkill].addXp(xpGain)
      const diff = powerLevel.value - monster.level
      let msg = `⚔️ ${monster.name} derrotado! +${frags} Fragmentos! (+${xpGain} XP em ${skills[xpSkill].name})`
      addLog(msg, diff <= 2 ? 'combat' : 'normal')
    } else {
      const msg = `💥 ${monster.name} te derrotou... Tente novamente!`
      addLog(msg, 'system')
    }
  }

  function startFight() {
    cancelCraft()
    cancelArmorCraft()
    if (anyBusy.value) return
    const monster = currentMonster.value
    const duration = 10000
    isFighting.value = true
    fightProgress.value = 0
    let elapsed = 0
    fightTimer = setInterval(() => {
      elapsed += 50
      fightProgress.value = Math.min(100, (elapsed / duration) * 100)
      if (elapsed >= duration) {
        clearInterval(fightTimer)
        fightTimer = null
        isFighting.value = false
        fightProgress.value = 0
        executeFight(monster)
      }
    }, 50)
  }

  function selectMonster(id) {
    cancelFight()
    selectedMonster.value = id
  }

  const currentSkill = computed(() => skills[selectedSkill.value])
  const skillRecipes = computed(() => RECIPES[selectedSkill.value])
  const activeRecipe = computed(() => {
    const recipes = RECIPES[selectedSkill.value]
    return recipes.find(r => r.id === selectedRecipe.value) || recipes[0]
  })

  function cancelCraft() {
    if (craftTimer) {
      clearInterval(craftTimer)
      craftTimer = null
    }
    isCrafting.value = false
    craftProgress.value = 0
    currentCraftRecipe.value = null
  }

  function selectSkill(id) {
    cancelCraft()
    selectedSkill.value = id
    selectedRecipe.value = RECIPES[id][0].id
  }

  function selectRecipe(id) {
    selectedRecipe.value = id
  }

  function addLog(message, type = 'normal') {
    logs.value.push({ message, type })
    if (logs.value.length > 500) logs.value.splice(0, logs.value.length - 200)
  }

  function hasCost(cost) {
    for (const [item, amount] of Object.entries(cost)) {
      if ((inventory.value[item] || 0) < amount) return false
    }
    return true
  }

  function payCost(cost) {
    for (const [item, amount] of Object.entries(cost)) {
      inventory.value[item] -= amount
    }
  }

  function executeRecipe(recipe) {
    payCost(recipe.cost)
    const bonuses = activeBonuses.value

    const hasChance = 'chance' in recipe
    const finalChance = Math.min(1, hasChance ? recipe.chance + bonuses.successBonus : 1)
    const success = hasChance ? Math.random() < finalChance : true

    if (success) {
      const gain = recipe.minGain === recipe.maxGain
        ? recipe.minGain
        : randomInt(recipe.minGain, recipe.maxGain)
      inventory.value[recipe.resource] += gain
      const xpGain = Math.floor(recipe.xp * bonuses.xpMult)
      const leveledUp = skills[selectedSkill.value].addXp(xpGain)
      const diff = skills[selectedSkill.value].level - recipe.level
      let msg = `${recipe.name}: +${gain} ${recipe.resource}! (+${xpGain} XP)`
      if (leveledUp) msg += ` 🌟 ${skills[selectedSkill.value].name} subiu para nível ${skills[selectedSkill.value].level}!`
      addLog(msg, diff <= 2 ? 'combat' : 'normal')
    } else {
      const xpGain = Math.max(1, Math.floor((recipe.xp / 2) * bonuses.xpMult))
      const leveledUp = skills[selectedSkill.value].addXp(xpGain)
      let msg = `${recipe.name}: não pegou nada... (+${xpGain} XP)`
      if (leveledUp) msg += ` 🌟 ${skills[selectedSkill.value].name} subiu para nível ${skills[selectedSkill.value].level}!`
      addLog(msg, 'system')
    }

    craftFlash.value++
    if (craftFlash.value > 9999) craftFlash.value = 0
  }

  function executeAction(recipe) {
    cancelFight()
    cancelArmorCraft()
    if (anyBusy.value) return
    if (skills[selectedSkill.value].level < recipe.level) {
      addLog(`Nível necessário: ${recipe.level}. Seu nível: ${skills[selectedSkill.value].level}`, 'system')
      return
    }
    if (!hasCost(recipe.cost)) {
      addLog('Recursos insuficientes!', 'system')
      return
    }
    const duration = Math.floor((recipe.duration || 8000) * activeBonuses.value.speedMult)
    isCrafting.value = true
    craftProgress.value = 0
    currentCraftRecipe.value = recipe
    let elapsed = 0
    craftTimer = setInterval(() => {
      elapsed += 50
      craftProgress.value = Math.min(100, (elapsed / duration) * 100)
      if (elapsed >= duration) {
        clearInterval(craftTimer)
        craftTimer = null
        isCrafting.value = false
        craftProgress.value = 0
        currentCraftRecipe.value = null
        executeRecipe(recipe)
      }
    }, 50)
  }

  function executeActionDirect(recipe) {
    if (skills[selectedSkill.value].level < recipe.level) return
    if (!hasCost(recipe.cost)) return
    executeRecipe(recipe)
  }

  function executeAutoplayTurn() {
    const tab = activeTab.value
    if (tab === 'profession') {
      const sid = autoplaySkill.value
      if (!sid) return
      const recipes = RECIPES[sid]
      const available = recipes.filter(r => skills[sid].level >= r.level && hasCost(r.cost))
      if (available.length === 0) return
      const prevSkill = selectedSkill.value
      const prevRecipe = selectedRecipe.value
      const recipe = available.find(r => r.id === prevRecipe) || available[0]
      selectedSkill.value = sid
      selectedRecipe.value = recipe.id
      currentAutoplayRecipe.value = recipe
      executeActionDirect(recipe)
      selectedSkill.value = prevSkill
      selectedRecipe.value = prevRecipe
    } else if (tab === 'pvm') {
      const monster = currentMonster.value
      if (!monster || isFighting.value) return
      currentAutoplayRecipe.value = monster
      startFight()
    } else if (tab === 'equipment') {
      const affordable = ARMOR_PIECES
        .filter(p => armorFragments.value >= p.cost && !craftedArmor.value.includes(p.id))
      if (affordable.length === 0) return
      const piece = affordable[0]
      currentAutoplayRecipe.value = piece
      executeCraftArmor(piece)
    }
  }

  function startAutoplay() {
    cancelCraft()
    cancelFight()
    cancelArmorCraft()
    autoplaySkill.value = activeTab.value === 'profession' ? selectedSkill.value : null
    currentAutoplayRecipe.value = null
    const duration = 8000
    const interval = 50
    let elapsed = 0
    autoplayTimer = setInterval(() => {
      elapsed += interval
      timerProgress.value = Math.min(100, (elapsed / duration) * 100)
      if (elapsed >= duration) {
        elapsed = 0
        timerProgress.value = 0
        executeAutoplayTurn()
      }
    }, interval)
  }

  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null }
    timerProgress.value = 0
    autoplaySkill.value = null
    currentAutoplayRecipe.value = null
  }

  function toggleIdle() {
    isIdle.value = !isIdle.value
    addLog(isIdle.value ? 'Modo Automático ativado!' : 'Modo Automático desativado.', 'system')
    if (isIdle.value) startAutoplay()
    else stopAutoplay()
  }

  const user = ref(null)
  const session = ref(null)
  const isCloudLoading = ref(false)
  const lastCloudSaveTime = ref(null)

  function applySaveData(data) {
    if (!data) return
    if (data.armorFragments !== undefined) armorFragments.value = data.armorFragments
    if (data.craftedArmor) craftedArmor.value = data.craftedArmor
    if (data.equipped) {
      for (const slot of ARMOR_SLOTS) {
        const id = data.equipped[slot]
        equipped[slot] = id ? ARMOR_PIECES.find(p => p.id === id) || null : null
      }
    }
    if (data.inventory) {
      // Reset inventory and merge
      Object.assign(inventory.value, { logs: 0, ores: 0, fish: 0, food: 0 }, data.inventory)
    }
    if (data.logs) logs.value = [...data.logs]
    if (data.skills) {
      for (const [id, s] of Object.entries(data.skills)) {
        if (skills[id]) {
          skills[id].level = s.level
          skills[id].xp = s.xp
          skills[id].maxXp = s.maxXp
        }
      }
    }
  }

  let lastCloudSave = 0

  async function saveGame(forceCloud = false) {
    const data = {
      skills: {},
      inventory: inventory.value,
      logs: logs.value.slice(-200),
    }
    for (const [id, skill] of Object.entries(skills)) {
      data.skills[id] = {
        level: skill.level,
        xp: skill.xp,
        maxXp: skill.maxXp,
      }
    }
    data.armorFragments = armorFragments.value
    data.craftedArmor = craftedArmor.value
    data.equipped = {}
    for (const slot of ARMOR_SLOTS) {
      data.equipped[slot] = equipped[slot] ? equipped[slot].id : null
    }

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {}

    if (user.value) {
      const now = Date.now()
      if (forceCloud || now - lastCloudSave >= 60000) {
        lastCloudSave = now
        try {
          const { error } = await supabase
            .from('player_saves')
            .upsert({
              user_id: user.value.id,
              save_data: data,
              updated_at: new Date().toISOString()
            })
          if (error) {
            console.error('Erro ao sincronizar nuvem:', error.message)
          } else {
            lastCloudSaveTime.value = new Date().toLocaleString()
          }
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return
      applySaveData(JSON.parse(raw))
    } catch {}
  }

  async function loadGameFromCloud() {
    if (!user.value) return
    isCloudLoading.value = true
    try {
      const { data, error } = await supabase
        .from('player_saves')
        .select('save_data, updated_at')
        .eq('user_id', user.value.id)
        .maybeSingle()

      if (error) {
        addLog('Erro ao carregar save da nuvem.', 'system')
        console.error(error)
      } else if (data && data.save_data) {
        applySaveData(data.save_data)
        if (data.updated_at) {
          lastCloudSaveTime.value = new Date(data.updated_at).toLocaleString()
        }
        addLog('Save carregado da nuvem com sucesso!', 'blessing')
      } else {
        addLog('Nenhum save em nuvem encontrado. Criando save inicial...', 'system')
        await saveGame(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      isCloudLoading.value = false
    }
  }

  let saveTimer = null
  let authSubscription = null

  onMounted(() => {
    loadGame()
    saveTimer = setInterval(() => saveGame(false), 5000)
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveGame(true)
    })

    // Listen to Supabase Auth state changes
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      session.value = initialSession
      user.value = initialSession?.user ?? null
      if (user.value) {
        loadGameFromCloud()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      if (newSession) {
        loadGameFromCloud()
      } else {
        // Se deslogar, mantém o progresso local
        lastCloudSaveTime.value = null
      }
    })
    authSubscription = subscription
  })

  onUnmounted(() => {
    if (saveTimer) clearInterval(saveTimer)
    document.removeEventListener('visibilitychange', () => {
      if (document.hidden) saveGame(true)
    })
    if (authSubscription) {
      authSubscription.unsubscribe()
    }
  })

  return {
    skills, inventory, logs, RECIPES, recipeColor,
    selectedSkill, selectedRecipe, currentSkill, skillRecipes, activeRecipe,
    isIdle, timerProgress, isCrafting, craftProgress, craftFlash, autoplaySkill, currentAutoplayRecipe,
    anyBusy, isCraftingArmor, armorCraftProgress, currentCraftRecipe,
    armorFragments, equipped, craftedArmor, activeTab, ARMOR_PIECES, ARMOR_SLOTS, activeBonuses,
    selectedMonster, isFighting, fightProgress, powerLevel, currentMonster, MONSTERS,
    fightSuccessChance, startFight, cancelFight, selectMonster,
    selectSkill, selectRecipe, executeAction, toggleIdle, cancelCraft, cancelArmorCraft,
    canCraftArmor, executeCraftArmor, equipArmor, unequipArmor,
    user, session, isCloudLoading, lastCloudSaveTime, saveGame, loadGameFromCloud
  }
}
