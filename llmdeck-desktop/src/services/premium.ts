import { getBrowser, getOS } from '~app/utils/navigator'

interface PremiumActivation {
  licenseKey: string
  instanceId: string
}

export function getPremiumActivation(): PremiumActivation | null {
  return {
    licenseKey: 'LOCAL-WEB-APP-UNLOCKED',
    instanceId: 'LOCAL-WEB-APP-INSTANCE',
  }
}

export async function validatePremium() {
  return { valid: true }
}

export async function activatePremium(licenseKey: string): Promise<PremiumActivation> {
  return getPremiumActivation()!
}

export async function deactivatePremium() {
  // no-op
}
