export type ProviderSecrets = {
  cfEndpoint: string
  cfToken: string
  leonardoEndpoint: string
  leonardoApiKey: string
}

const KEY = 'sfd:secrets:v1'

export function loadSecrets(): ProviderSecrets {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return { cfEndpoint: '', cfToken: '', leonardoEndpoint: '', leonardoApiKey: '' }
    }
    const j = JSON.parse(raw) as Partial<ProviderSecrets>
    return {
      cfEndpoint: j.cfEndpoint ?? '',
      cfToken: j.cfToken ?? '',
      leonardoEndpoint: j.leonardoEndpoint ?? '',
      leonardoApiKey: j.leonardoApiKey ?? '',
    }
  } catch {
    return { cfEndpoint: '', cfToken: '', leonardoEndpoint: '', leonardoApiKey: '' }
  }
}

export function saveSecrets(next: ProviderSecrets) {
  localStorage.setItem(KEY, JSON.stringify(next))
}
