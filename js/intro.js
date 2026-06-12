/**
 * Boot-time intro: a TAP TO START gate (the tap is the user gesture that
 * unlocks audio), then the landing video plays full-screen with sound.
 * Tapping again skips the video — but every path ends on the permanent
 * "ACCESS DENIED" splash. It cannot be dismissed; the game never boots
 * past it.
 *
 * @returns {Promise<void>} resolves only when no #intro gate exists in the
 *   page (the denied splash otherwise holds forever).
 */
export function playIntro() {
  return new Promise((resolve) => {
    const gate = document.getElementById('intro')
    if (!gate) return resolve()

    let video = null
    let deniedShown = false
    // The prank ending: this splash is final — no tap dismisses it, and the
    // promise never resolves. Delete this dead end to let players through.
    const showDenied = () => {
      if (deniedShown) return
      deniedShown = true
      video?.pause()
      const msg = document.createElement('p')
      msg.className = 'intro-denied'
      msg.textContent = 'SORRY YEHYA — ACCESS DENIED'
      gate.replaceChildren(msg)
    }

    gate.addEventListener(
      'click',
      () => {
        video = document.createElement('video')
        video.src = '/assets/intro.mp4'
        video.playsInline = true
        video.setAttribute('playsinline', '') // iOS: stay inline, no native player takeover
        video.preload = 'auto'

        const hint = document.createElement('p')
        hint.className = 'intro-hint intro-skip'
        hint.textContent = 'tap to skip'
        gate.replaceChildren(video, hint)

        video.addEventListener('ended', showDenied)
        video.addEventListener('error', showDenied)
        gate.addEventListener('click', showDenied) // second tap skips the video
        video.play().catch(showDenied) // playback refused → straight to the splash
      },
      { once: true },
    )
  })
}
