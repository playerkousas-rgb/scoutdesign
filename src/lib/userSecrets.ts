export type ProviderSecrets = {
  cfEndpoint: string
  cfToken: string
  cfAccountId?: string
  leonardoEndpoint: string
  leonardoApiKey: string
  openaiApiKey?: string
  openaiBaseUrl?: string
  togetherApiKey?: string
  geminiApiKey?: string
}

const KEY = 'sfd:secrets:v1'

export function loadSecrets(): ProviderSecrets {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return {
        cfEndpoint: '',
        cfToken: '',
        cfAccountId: '',
        leonardoEndpoint: '',
        leonardoApiKey: '',
        openaiApiKey: '',
        openaiBaseUrl: '',
        togetherApiKey: '',
        geminiApiKey: '',
      }
    }
    const j = JSON.parse(raw) as Partial<ProviderSecrets>
    return {
      cfEndpoint: j.cfEndpoint ?? '',
      cfToken: j.cfToken ?? '',
      cfAccountId: j.cfAccountId ?? '',
      leonardoEndpoint: j.leonardoEndpoint ?? '',
      leonardoApiKey: j.leonardoApiKey ?? '',
      openaiApiKey: j.openaiApiKey ?? '',
      openaiBaseUrl: j.openaiBaseUrl ?? '',
      togetherApiKey: j.togetherApiKey ?? '',
      geminiApiKey: j.geminiApiKey ?? '',
    }
  } catch {
    return {
      cfEndpoint: '',
      cfToken: '',
      cfAccountId: '',
      leonardoEndpoint: '',
      leonardoApiKey: '',
      openaiApiKey: '',
      openaiBaseUrl: '',
      togetherApiKey: '',
      geminiApiKey: '',
    }
  }
}

export function saveSecrets(next: ProviderSecrets) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

