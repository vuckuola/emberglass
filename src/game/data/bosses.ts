import type { CharacterStats } from "./characters";
import type { EnemySkill } from "./enemies";

export interface BossPhase {
  hpThreshold: number;
  newSkill?: EnemySkill;
  behaviorChange?: string;
}

export interface Boss {
  id: string;
  name: string;
  region: string;
  stats: CharacterStats;
  phases: BossPhase[];
  skills: EnemySkill[];
  weaknesses: string[];
  resists: string[];
  expReward: number;
  goldReward: number;
  spritePath: string;
  introDialogue: string[];
}

export const BOSSES: Boss[] = [
  {
    id: "thornheart",
    name: "Thornheart",
    region: "verdant",
    stats: { hp: 350, mp: 60, atk: 18, def: 16, spd: 8, mag: 14 },
    phases: [
      {
        hpThreshold: 50,
        newSkill: { id: "entangle", name: "Entangle", power: 18, element: "earth", chance: 0.35 },
        behaviorChange: "Roots spread across the arena, slowing the party.",
      },
      {
        hpThreshold: 25,
        behaviorChange: "Thornheart hardens its bark and lashes wildly.",
      },
    ],
    skills: [
      { id: "bramble_crush", name: "Bramble Crush", power: 20, element: "earth", chance: 0.4 },
      { id: "heart_spores", name: "Heart Spores", power: 16, element: "dark", chance: 0.3 },
      { id: "rootguard", name: "Rootguard", power: 0, element: "earth", chance: 0.3 },
    ],
    weaknesses: ["fire"],
    resists: ["earth"],
    expReward: 180,
    goldReward: 120,
    spritePath: "assets/sprites/bosses/thornheart.png",
    introDialogue: [
      "The archive roots clutch at maps no living hand should read.",
      "Step softly, little cartographer. Every path here feeds me.",
    ],
  },
  {
    id: "refraction_queen",
    name: "Refraction Queen",
    region: "mirrordrift",
    stats: { hp: 450, mp: 90, atk: 20, def: 18, spd: 12, mag: 20 },
    phases: [
      {
        hpThreshold: 60,
        newSkill: { id: "mirror_creation", name: "Create Mirror", power: 0, element: "light", chance: 0.4 },
        behaviorChange: "A perfect mirror copy enters the rotation.",
      },
      {
        hpThreshold: 30,
        behaviorChange: "The queen refracts every strike into splintering counterlight.",
      },
    ],
    skills: [
      { id: "prism_lance", name: "Prism Lance", power: 22, element: "light", chance: 0.4 },
      { id: "glass_storm", name: "Glass Storm", power: 18, element: "earth", chance: 0.35 },
      { id: "false_crown", name: "False Crown", power: 15, element: "arcane", chance: 0.25 },
    ],
    weaknesses: ["earth"],
    resists: ["light"],
    expReward: 260,
    goldReward: 190,
    spritePath: "assets/sprites/bosses/refraction_queen.png",
    introDialogue: [
      "You have crossed a desert made of answers.",
      "Now choose which reflection deserves to leave.",
    ],
  },
  {
    id: "storm_seraph",
    name: "Storm Seraph",
    region: "thunderveil",
    stats: { hp: 550, mp: 120, atk: 24, def: 20, spd: 16, mag: 24 },
    phases: [
      {
        hpThreshold: 66,
        newSkill: { id: "seraph_charge", name: "Seraph Charge", power: 0, element: "thunder", chance: 0.35 },
        behaviorChange: "The seraph gathers thunder for a devastating release.",
      },
      {
        hpThreshold: 33,
        newSkill: { id: "lightning_arena", name: "Lightning Arena", power: 26, element: "thunder", chance: 0.4 },
        behaviorChange: "The arena becomes a grid of lightning strikes.",
      },
      {
        hpThreshold: 15,
        behaviorChange: "The seraph abandons restraint and attacks relentlessly.",
      },
    ],
    skills: [
      { id: "judgment_bolt", name: "Judgment Bolt", power: 24, element: "thunder", chance: 0.4 },
      { id: "wing_sunder", name: "Wing Sunder", power: 20, element: "wind", chance: 0.35 },
      { id: "choir_static", name: "Choir Static", power: 17, element: "thunder", chance: 0.25 },
    ],
    weaknesses: ["ice"],
    resists: ["thunder"],
    expReward: 360,
    goldReward: 280,
    spritePath: "assets/sprites/bosses/storm_seraph.png",
    introDialogue: [
      "The Thunderveil remembers every vow broken beneath its clouds.",
      "Answer with truth, or be written in lightning.",
    ],
  },
  {
    id: "cartographers_lie",
    name: "Cartographer's Lie",
    region: "skywell",
    stats: { hp: 800, mp: 180, atk: 28, def: 24, spd: 18, mag: 30 },
    phases: [
      {
        hpThreshold: 66,
        newSkill: { id: "map_distort", name: "Map Distort", power: 24, element: "arcane", chance: 0.35 },
        behaviorChange: "The battlefield folds into impossible routes.",
      },
      {
        hpThreshold: 33,
        newSkill: { id: "memory_erase", name: "Memory Erase", power: 28, element: "dark", chance: 0.4 },
        behaviorChange: "Names and commands blur at the edge of thought.",
      },
      {
        hpThreshold: 10,
        behaviorChange: "The lie collapses inward, dragging the Skywell with it.",
      },
    ],
    skills: [
      { id: "false_horizon", name: "False Horizon", power: 26, element: "arcane", chance: 0.35 },
      { id: "covenant_break", name: "Covenant Break", power: 30, element: "dark", chance: 0.35 },
      { id: "skywell_inversion", name: "Skywell Inversion", power: 24, element: "light", chance: 0.3 },
    ],
    weaknesses: ["arcane"],
    resists: ["dark"],
    expReward: 600,
    goldReward: 500,
    spritePath: "assets/sprites/bosses/cartographers_lie.png",
    introDialogue: [
      "Every map is a promise that the world can be known.",
      "I am the promise your hands made false.",
      "Draw your final route, Nara.",
    ],
  },
];

export const BOSSES_BY_ID: Record<string, Boss> = Object.fromEntries(
  BOSSES.map((boss) => [boss.id, boss]),
);
