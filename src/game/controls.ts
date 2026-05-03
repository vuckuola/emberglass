export const CONTROLS = {
  move: { keys: 'WASD / Arrow Keys', description: 'Move' },
  dash: { key: 'Shift', description: 'Dash' },
  attack: { keys: 'Space / Left Click', description: 'Attack' },
  block: { key: 'F', description: 'Block / Parry' },
  skills: { key: '1–4', description: 'Skills' },
  potion: { key: 'Q', description: 'Quick Potion' },
  interact: { key: 'E', description: 'Interact' },
  fullMap: { key: 'M', description: 'Full Map' },
  minimap: { key: 'Tab', description: 'Minimap Toggle' },
  help: { key: 'H', description: 'Help Overlay' },
  menu: { key: 'Esc', description: 'Pause / Menu' },
  touchMove: { key: 'Virtual Joystick', description: 'Move' },
  touchAttack: { key: 'Attack Button', description: 'Attack' },
  touchDash: { key: 'Dash Button', description: 'Dash' },
  touchBlock: { key: 'Shield Button', description: 'Block / Parry' },
  touchInteract: { key: 'Interact Button', description: 'Interact' },
} as const

export const CONTROLS_DISPLAY = `WASD/Arrows: Move | Shift: Dash | Space/Click: Attack | F: Block | 1-4: Skills | Q: Potion | E: Interact | M: Map | Tab: Minimap | H: Help | Esc: Menu`

export const CONTROLS_SHORT = `WASD: Move | Shift: Dash | Space: Attack | 1-4: Skills | F: Block | Q: Potion | E: Interact`
