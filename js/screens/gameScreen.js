import { Container, Graphics, Text } from 'pixi.js'

/**
 * Placeholder game screen shown after login. Phase 2 replaces this with the
 * PixiJS rocket game (ported from the legacy canvas prototype in git history).
 *
 * @param {import('pixi.js').Application} app
 * @param {object} player  the logged-in player record
 * @returns {Container}
 */
export function createGameScreen(app, player) {
  const screen = new Container()
  const { width, height } = app.screen
  const name = (player?.username ?? 'pilot').toUpperCase()

  // A simple moon on the horizon to set the scene.
  const moon = new Graphics()
    .circle(width * 0.5, height * 0.28, Math.min(width, height) * 0.14)
    .fill({ color: 0xd9dde6 })
    .circle(width * 0.5 - 18, height * 0.28 - 10, 8)
    .fill({ color: 0xb9bfca })
    .circle(width * 0.5 + 22, height * 0.28 + 14, 11)
    .fill({ color: 0xb9bfca })
  screen.addChild(moon)

  const msg = new Text({
    text: [
      `WELCOME, ${name}`,
      '',
      'MISSION: launch from Earth, fly through the',
      'atmosphere, and reach the Moon.',
      'Mine its resources to build your colony.',
      '',
      `credits: ${player?.coins ?? 0}${player?.guest ? '  (guest — local only)' : ''}`,
      '',
      '— rocket game lands here (Phase 2) —',
    ].join('\n'),
    style: {
      fill: '#bfe3ff',
      fontSize: 16,
      fontFamily: 'monospace',
      align: 'center',
      lineHeight: 24,
    },
  })
  msg.anchor.set(0.5)
  msg.x = width / 2
  msg.y = height * 0.62
  screen.addChild(msg)

  return screen
}
