<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

const props = defineProps({
  isOpen: Boolean,
  user: Object,
  lastCloudSaveTime: String,
  isCloudLoading: Boolean,
})

const emit = defineEmits(['close', 'manualSync'])

const mode = ref('login') // 'login', 'register', 'profile'
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor, preencha todos os campos.'
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
    successMessage.value = 'Login realizado com sucesso!'
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Erro ao realizar login.'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''
  if (!email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Por favor, preencha todos os campos.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas não coincidem.'
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
    successMessage.value = 'Cadastro realizado! Verifique seu e-mail para confirmação se necessário.'
    mode.value = 'login'
  } catch (err) {
    errorMessage.value = err.message || 'Erro ao realizar cadastro.'
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    successMessage.value = 'Desconectado com sucesso!'
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      emit('close')
    }, 1000)
  } catch (err) {
    errorMessage.value = err.message || 'Erro ao deslogar.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <span v-if="user">🛡️ Perfil da Conta</span>
          <span v-else-if="mode === 'login'">⚔️ Acessar Conta</span>
          <span v-else>📜 Nova Conta</span>
        </h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <!-- ALERTAS -->
        <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
        <div v-if="successMessage" class="alert success">{{ successMessage }}</div>

        <!-- MODO: USUÁRIO LOGADO -->
        <div v-if="user" class="logged-in-view">
          <div class="info-group">
            <span class="info-label">E-mail:</span>
            <span class="info-value">{{ user.email }}</span>
          </div>
          <div class="info-group">
            <span class="info-label">Status da Nuvem:</span>
            <span class="info-value text-green">Conectado (Progresso Seguro)</span>
          </div>
          <div class="info-group">
            <span class="info-label">Último Salvamento:</span>
            <span class="info-value">{{ lastCloudSaveTime || 'Salvando agora...' }}</span>
          </div>

          <div class="actions">
            <button 
              class="btn-primary" 
              :disabled="loading || isCloudLoading" 
              @click="emit('manualSync')"
            >
              <span v-if="isCloudLoading">Sincronizando...</span>
              <span v-else>Sincronizar Agora 🔄</span>
            </button>
            <button 
              class="btn-secondary" 
              :disabled="loading" 
              @click="handleLogout"
            >
              Desconectar Conta 🚪
            </button>
          </div>
        </div>

        <!-- MODO: LOGIN -->
        <form v-else-if="mode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-email">E-mail</label>
            <input 
              id="login-email" 
              type="email" 
              v-model="email" 
              placeholder="seu-email@exemplo.com"
              required
            />
          </div>
          <div class="form-group">
            <label for="login-password">Senha</label>
            <input 
              id="login-password" 
              type="password" 
              v-model="password" 
              placeholder="Sua senha" 
              required
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Carregando...' : 'Entrar no Jogo ⚔️' }}
          </button>
          
          <div class="switch-mode">
            Não tem uma conta? 
            <a href="#" @click.prevent="mode = 'register'">Crie uma aqui!</a>
          </div>
        </form>

        <!-- MODO: CADASTRO -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="reg-email">E-mail</label>
            <input 
              id="reg-email" 
              type="email" 
              v-model="email" 
              placeholder="seu-email@exemplo.com" 
              required
            />
          </div>
          <div class="form-group">
            <label for="reg-password">Senha</label>
            <input 
              id="reg-password" 
              type="password" 
              v-model="password" 
              placeholder="Mínimo 6 caracteres" 
              required
            />
          </div>
          <div class="form-group">
            <label for="reg-confirm">Confirmar Senha</label>
            <input 
              id="reg-confirm" 
              type="password" 
              v-model="confirmPassword" 
              placeholder="Repita sua senha" 
              required
            />
          </div>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Registrando...' : 'Criar Conta e Jogar 📜' }}
          </button>
          
          <div class="switch-mode">
            Já possui uma conta? 
            <a href="#" @click.prevent="mode = 'login'">Faça login aqui!</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: linear-gradient(180deg, #1c130f 0%, #100a08 100%);
  border: 3px solid #8b6b3a;
  border-radius: 8px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  animation: modal-fade-in 0.25s ease-out;
}

@keyframes modal-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-header {
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  border-bottom: 2px solid #8b6b3a;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  color: #ffd700;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.close-btn {
  background: none;
  border: none;
  color: #c0a88a;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}

.close-btn:hover {
  color: #ff8c00;
}

.modal-body {
  padding: 20px 24px;
}

.alert {
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  line-height: 1.4;
  border: 1px solid;
}

.alert.error {
  background: rgba(220, 53, 69, 0.15);
  border-color: #dc3545;
  color: #ff6b6b;
}

.alert.success {
  background: rgba(40, 167, 69, 0.15);
  border-color: #28a745;
  color: #2ecc71;
}

/* FORMS */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #ffd700;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.form-group input {
  background: #000;
  border: 1px solid #6b4c2a;
  color: #f5f0eb;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #ffd700;
}

/* BUTTONS */
.btn-primary, .btn-secondary {
  border-radius: 4px;
  padding: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 2px solid;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(180deg, #8b6b3a, #5c4220);
  border-color: #ffd700;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #a68146, #70522a);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

.btn-secondary {
  background: linear-gradient(180deg, #2a1a0e, #1c1109);
  border-color: #6b4c2a;
  color: #c0a88a;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(180deg, #3d2817, #2a1a0e);
  color: #fff;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-mode {
  text-align: center;
  font-size: 0.8rem;
  color: #a8947e;
  margin-top: 10px;
}

.switch-mode a {
  color: #ffd700;
  text-decoration: none;
  font-weight: bold;
}

.switch-mode a:hover {
  text-decoration: underline;
}

/* LOGGED IN VIEW */
.logged-in-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-group {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #2a1a0e;
  padding-bottom: 8px;
  font-size: 0.9rem;
}

.info-label {
  color: #a8947e;
}

.info-value {
  color: #fff;
  font-weight: bold;
}

.text-green {
  color: #00ff9f !important;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}
</style>
