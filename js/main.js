import { Application } from 'pixi.js'
import { autoLogin } from './auth.js'
import { createTitleScreen } from './screens/titleScreen.js'
import { createGameScreen } from './screens/gameScreen.js'

const app = new Application()
const overlay = document.getElementById('auth-overlay')

let current = null

/** Swap the active screen, cleaning up and destroying the previous one. */
function show(screen) {
  if (current) {
    current.cleanup?.()
    app.stage.removeChild(current)
    current.destroy({ children: true })
  }
  current = screen
  app.stage.addChild(screen)
}

function goToGame(player) {
  overlay.classList.remove('visible')
  show(createGameScreen(app, player))
}

function goToTitle() {
  show(createTitleScreen(app, { overlay, onLaunch: goToGame }))
}

async function boot() {
  await app.init({
    background: '#05060f',
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
  })
  document.getElementById('app').appendChild(app.canvas)

  // Returning player? Skip the title form and drop straight into the game.
  const player = await autoLogin()
  if (player) goToGame(player)
  else goToTitle()
}

boot()
