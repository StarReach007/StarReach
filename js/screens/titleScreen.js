import { Container, Graphics, Text } from 'pixi.js'
import { loginOrRegister } from '../auth.js'

/**
 * Title screen: animated starfield + glowing title. The callsign form is the
 * HTML overlay (passed in); this wires its LAUNCH button to the auth flow.
 *
 * @param {import('pixi.js').Application} app
 * @param {{ overlay: HTMLElement, onLaunch: (player: object) => void }} opts
 * @returns {Container}
 */
export function createTitleScreen(app, { overlay, onLaunch }) {
  const screen = new Container()
  const { width, height } = app.screen

  // --- starfield ---
  const starLayer = new Graphics()
  screen.addChild(starLayer)
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.6 + 0.3,
    speed: Math.random() * 0.4 + 0.08,
  }))

  // --- title + tagline ---
  const title = new Text({
    text: 'STAR REACH',
    style: {
      fill: '#cfe8ff',
      fontSize: 46,
      fontWeight: '900',
      fontFamily: 'monospace',
      letterSpacing: 4,
      align: 'center',
      dropShadow: { color: '#1e6bff', blur: 14, distance: 0, alpha: 0.8 },
    },
  })
  title.anchor.set(0.5)
  title.x = width / 2
  title.y = height * 0.34
  screen.addChild(title)

  const tagline = new Text({
    text: 'reach the moon · mine resources · build your colony',
    style: { fill: '#6f8bb5', fontSize: 13, fontFamily: 'monospace', align: 'center' },
  })
  tagline.anchor.set(0.5)
  tagline.x = width / 2
  tagline.y = title.y + 40
  screen.addChild(tagline)

  // --- animation (v8 ticker callback receives a Ticker; use deltaTime) ---
  let t = 0
  const tick = (time) => {
    t += time.deltaTime
    starLayer.clear()
    for (const s of stars) {
      s.y += s.speed * time.deltaTime
      if (s.y > height) {
        s.y = 0
        s.x = Math.random() * width
      }
      const a = 0.4 + 0.4 * Math.sin(t * 0.05 + s.x)
      starLayer.circle(s.x, s.y, s.r).fill({ color: 0xffffff, alpha: a })
    }
    title.scale.set(1 + Math.sin(t * 0.05) * 0.02)
  }
  app.ticker.add(tick)

  // --- HTML overlay wiring ---
  overlay.classList.add('visible')
  const input = overlay.querySelector('#callsign-input')
  const button = overlay.querySelector('#launch-button')
  const status = overlay.querySelector('#auth-status')

  const launch = async () => {
    button.disabled = true
    status.textContent = ''
    try {
      const player = await loginOrRegister(input.value)
      onLaunch(player)
    } catch (err) {
      status.textContent = err.message || 'Login failed.'
      button.disabled = false
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter') launch()
  }
  button.addEventListener('click', launch)
  input.addEventListener('keydown', onKey)
  setTimeout(() => input.focus(), 0)

  // Called by main.show() before this screen is destroyed.
  screen.cleanup = () => {
    app.ticker.remove(tick)
    button.removeEventListener('click', launch)
    input.removeEventListener('keydown', onKey)
    overlay.classList.remove('visible')
  }

  return screen
}
