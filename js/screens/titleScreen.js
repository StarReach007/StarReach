import { Container, Graphics, Text } from 'pixi.js'
import { continueAsGuest, login, register } from '../auth.js'

/**
 * Title screen: animated starfield + glowing title. The HTML overlay (passed
 * in) starts on a two-button menu (TRY THE GAME / LOGIN-JOIN); the email +
 * password form is revealed behind LOGIN / JOIN.
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
  const menuView = overlay.querySelector('#menu-view')
  const loginView = overlay.querySelector('#login-view')
  const emailInput = overlay.querySelector('#email-input')
  const userInput = overlay.querySelector('#callsign-input')
  const pwInput = overlay.querySelector('#password-input')
  const tryBtn = overlay.querySelector('#try-button')
  const joinBtn = overlay.querySelector('#join-button')
  const loginBtn = overlay.querySelector('#login-button')
  const registerBtn = overlay.querySelector('#register-button')
  const backBtn = overlay.querySelector('#back-button')
  const status = overlay.querySelector('#auth-status')
  const buttons = [tryBtn, joinBtn, loginBtn, registerBtn, backBtn]

  const setBusy = (busy) => buttons.forEach((b) => (b.disabled = busy))
  const setStatus = (msg, ok = false) => {
    status.textContent = msg
    status.style.color = ok ? '#7ed9a0' : '#ff8080'
  }

  // Runs an auth action; a null result means "account created, confirm email".
  const run = async (action) => {
    setBusy(true)
    setStatus('')
    try {
      const player = await action()
      if (player) onLaunch(player)
      else {
        setStatus('Account created — check your email to confirm, then log in.', true)
        setBusy(false)
      }
    } catch (err) {
      setStatus(err.message || 'Something went wrong.')
      setBusy(false)
    }
  }

  // Two-view card: the menu (TRY THE GAME / LOGIN-JOIN) is the front door;
  // the email/password form only appears behind LOGIN / JOIN.
  const showLoginView = (show) => {
    menuView.hidden = show
    loginView.hidden = !show
    setStatus('')
    if (show) setTimeout(() => emailInput.focus(), 0)
  }

  const onLogin = () => run(() => login(emailInput.value, pwInput.value))
  const onRegister = () =>
    run(() => register(emailInput.value, userInput.value, pwInput.value))
  const onTry = () => run(() => continueAsGuest())
  const onJoin = () => showLoginView(true)
  const onBack = () => showLoginView(false)
  const onKey = (e) => {
    if (e.key === 'Enter') onLogin()
  }

  tryBtn.addEventListener('click', onTry)
  joinBtn.addEventListener('click', onJoin)
  loginBtn.addEventListener('click', onLogin)
  registerBtn.addEventListener('click', onRegister)
  backBtn.addEventListener('click', onBack)
  emailInput.addEventListener('keydown', onKey)
  pwInput.addEventListener('keydown', onKey)

  // Called by main.show() before this screen is destroyed.
  screen.cleanup = () => {
    app.ticker.remove(tick)
    tryBtn.removeEventListener('click', onTry)
    joinBtn.removeEventListener('click', onJoin)
    loginBtn.removeEventListener('click', onLogin)
    registerBtn.removeEventListener('click', onRegister)
    backBtn.removeEventListener('click', onBack)
    emailInput.removeEventListener('keydown', onKey)
    pwInput.removeEventListener('keydown', onKey)
    showLoginView(false) // next visit starts on the menu
    overlay.classList.remove('visible')
  }

  return screen
}
