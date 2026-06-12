/**
 * Boot-time intro: a TAP TO START gate (the tap is the user gesture that
 * unlocks audio), then the landing video plays full-screen with sound.
 * Tapping again skips it.
 *
 * @returns {Promise<void>} resolves when the video ends, is skipped, or fails.
 */
export function playIntro() {
  return new Promise((resolve) => {
    const gate = document.getElementById('intro')
    if (!gate) return resolve()

    const finish = () => {
      gate.remove()
      resolve()
    }

    gate.addEventListener(
      'click',
      () => {
        const video = document.createElement('video')
        video.src = '/assets/intro.mp4'
        video.playsInline = true
        video.setAttribute('playsinline', '') // iOS: stay inline, no native player takeover
        video.preload = 'auto'

        const hint = document.createElement('p')
        hint.className = 'intro-hint intro-skip'
        hint.textContent = 'tap to skip'
        gate.replaceChildren(video, hint)

        video.addEventListener('ended', finish)
        video.addEventListener('error', finish)
        gate.addEventListener('click', finish) // second tap skips
        video.play().catch(finish) // playback refused → drop straight into the game
      },
      { once: true },
    )
  })
}
