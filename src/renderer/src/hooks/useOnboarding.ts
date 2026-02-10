import { useState, useEffect, useCallback } from 'react'

export function useOnboarding() {
  const [onboardingDone, setOnboardingDone] = useState(true) // Default true to avoid flash
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    ;(async () => {
      const done = (await window.settings.get('onboardingDone')) as boolean | null
      setOnboardingDone(done === true)
      setInitialized(true)
    })()
  }, [])

  const completeOnboarding = useCallback(() => {
    setOnboardingDone(true)
    window.settings.set('onboardingDone', true)
  }, [])

  return { onboardingDone, completeOnboarding, initialized }
}
