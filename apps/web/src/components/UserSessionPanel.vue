<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const form = reactive({
  exportPassphrase: '',
  importPassphrase: '',
  privateKeyFileContents: '',
  privateKeyFileName: '',
  privateKeyFileRequiresPassphrase: false,
})

const ui = reactive({
  showExportForm: false,
  showImportForm: false,
  exportError: '',
  importError: '',
})

const currentLabel = computed(() => auth.currentUser?.username ?? 'Provisioning...')
const roleLabel = computed(() => auth.currentUser?.role.toUpperCase() ?? 'VIEWER')
const isBusy = computed(() => auth.status === 'loading')

const clearImportForm = () => {
  form.privateKeyFileContents = ''
  form.privateKeyFileName = ''
  form.privateKeyFileRequiresPassphrase = false
  form.importPassphrase = ''
  ui.importError = ''
}

const startDownloadFlow = () => {
  ui.exportError = ''
  ui.showExportForm = true
}

const cancelDownloadFlow = () => {
  ui.exportError = ''
  form.exportPassphrase = ''
  ui.showExportForm = false
}

const submitDownloadPrivateKey = async () => {
  ui.exportError = ''

  if (!form.exportPassphrase.trim()) {
    ui.exportError = 'Enter a passphrase before downloading the encrypted key file.'
    return
  }

  const success = await auth.downloadPrivateKey(form.exportPassphrase)
  if (success) {
    cancelDownloadFlow()
  }
}

const toggleRestoreFlow = () => {
  ui.importError = ''
  ui.showImportForm = !ui.showImportForm

  if (!ui.showImportForm) {
    clearImportForm()
  }
}

const submitPrivateKey = async () => {
  ui.importError = ''

  if (!form.privateKeyFileContents) {
    ui.importError = 'Choose a private key file to restore your session.'
    return
  }

  if (form.privateKeyFileRequiresPassphrase && !form.importPassphrase.trim()) {
    ui.importError = 'Passphrase is required for this encrypted key file.'
    return
  }

  const success = await auth.reauthenticateWithPrivateKey(
    form.privateKeyFileContents,
    form.importPassphrase,
  )

  if (success) {
    clearImportForm()
    ui.showImportForm = false
  }
}

const usePrivateKeyFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const fileContents = await file.text()
  form.privateKeyFileContents = fileContents
  form.privateKeyFileName = file.name
  form.privateKeyFileRequiresPassphrase = false

  try {
    const parsed = JSON.parse(fileContents) as { encrypted?: unknown }
    form.privateKeyFileRequiresPassphrase = parsed?.encrypted === true
  } catch {
    form.privateKeyFileRequiresPassphrase = false
  }

  ui.importError = ''
  input.value = ''
}
</script>

<template>
  <div class="session-panel">
    <div class="session-panel__identity">
      <span class="session-panel__label">Session</span>
      <span class="session-panel__name">{{ currentLabel }}</span>
      <span class="session-panel__role">{{ roleLabel }}</span>
    </div>

    <div class="session-panel__actions">
      <template v-if="auth.isAuthenticated">
        <button
          v-if="!ui.showExportForm"
          type="button"
          :disabled="isBusy"
          @click="startDownloadFlow"
        >
          Download encrypted private key
        </button>
        <div v-else class="session-panel__inline-form">
          <input
            v-model="form.exportPassphrase"
            type="password"
            placeholder="Passphrase for encrypted key export"
            autocomplete="new-password"
            required
          />
          <button type="button" :disabled="isBusy" @click="submitDownloadPrivateKey">
            Download key file
          </button>
          <button type="button" class="ghost" :disabled="isBusy" @click="cancelDownloadFlow">
            Cancel
          </button>
        </div>
      </template>
      <template v-else>
        <span class="session-panel__hint">A member account is provisioned automatically on entry.</span>
      </template>
    </div>

    <div class="session-panel__restore">
      <button type="button" class="ghost" :disabled="isBusy" @click="toggleRestoreFlow">
        {{ ui.showImportForm ? 'Cancel restore' : 'Restore from key file' }}
      </button>

      <div v-if="ui.showImportForm" class="session-panel__inline-form">
        <label class="file-picker">
          <span>{{ form.privateKeyFileName ? 'Choose another key file' : 'Choose key file' }}</span>
          <input type="file" accept=".json,.txt" :disabled="isBusy" @change="usePrivateKeyFile" />
        </label>
        <span v-if="form.privateKeyFileName" class="session-panel__file-name">
          {{ form.privateKeyFileName }}
        </span>
        <input
          v-model="form.importPassphrase"
          type="password"
          :placeholder="
            form.privateKeyFileRequiresPassphrase
              ? 'Passphrase (required for encrypted key files)'
              : 'Passphrase (only needed for encrypted key files)'
          "
          autocomplete="current-password"
        />
        <button
          type="button"
          class="ghost"
          :disabled="
            isBusy ||
            !form.privateKeyFileContents ||
            (form.privateKeyFileRequiresPassphrase && !form.importPassphrase.trim())
          "
          @click="submitPrivateKey"
        >
          Restore session
        </button>
      </div>
    </div>

    <p v-if="ui.exportError || ui.importError || auth.error" class="session-panel__error">
      {{ ui.exportError || ui.importError || auth.error }}
    </p>
  </div>
</template>

<style scoped>
.session-panel {
  display: grid;
  gap: 0.6rem;
  background: rgba(15, 23, 42, 0.06);
  padding: 0.75rem 1rem;
  border-radius: 1rem;
}

.session-panel__identity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.session-panel__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(15, 23, 42, 0.5);
}

.session-panel__name {
  font-weight: 600;
}

.session-panel__role {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #0f172a;
  color: #f8f6ee;
}

.session-panel__actions,
.session-panel__restore {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.session-panel__inline-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.session-panel__file-name {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.65);
}

.session-panel__hint {
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.65);
}

input,
button,
.file-picker {
  border-radius: 999px;
  font-size: 0.85rem;
}

input {
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.4rem 0.8rem;
  background: #ffffff;
}

button,
.file-picker {
  border: none;
  padding: 0.4rem 0.9rem;
  background: #0f172a;
  color: #f8f6ee;
  font-weight: 600;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.2);
  color: #0f172a;
}

.file-picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: transparent;
  color: #0f172a;
}

.file-picker input[type='file'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.session-panel__error {
  margin: 0;
  font-size: 0.75rem;
  color: #b91c1c;
}
</style>
