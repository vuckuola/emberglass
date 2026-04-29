export type ItemType = "consumable" | "weapon" | "charm" | "relic" | "key";

export interface ItemEffect {
  stat?: string;
  value?: number;
  healHp?: number;
  healMp?: number;
  cureStatus?: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  effect: ItemEffect;
  value: number;
  description: string;
}

export const ITEMS: Item[] = [
  {
    id: "health_potion",
    name: "Health Potion",
    type: "consumable",
    effect: { healHp: 50 },
    value: 25,
    description: "Restores 50 HP to one ally.",
  },
  {
    id: "mana_potion",
    name: "Mana Potion",
    type: "consumable",
    effect: { healMp: 30 },
    value: 35,
    description: "Restores 30 MP to one ally.",
  },
  {
    id: "health_elixir",
    name: "Health Elixir",
    type: "consumable",
    effect: { healHp: 150 },
    value: 90,
    description: "Restores 150 HP to one ally.",
  },
  {
    id: "mana_elixir",
    name: "Mana Elixir",
    type: "consumable",
    effect: { healMp: 80 },
    value: 110,
    description: "Restores 80 MP to one ally.",
  },
  {
    id: "revive_crystal",
    name: "Revive Crystal",
    type: "consumable",
    effect: { stat: "reviveHpPercent", value: 25 },
    value: 150,
    description: "Revives a KO ally with 25% HP.",
  },
  {
    id: "antidote",
    name: "Antidote",
    type: "consumable",
    effect: { cureStatus: "poison" },
    value: 20,
    description: "Cures poison from one ally.",
  },
  {
    id: "burn_salve",
    name: "Burn Salve",
    type: "consumable",
    effect: { cureStatus: "burn" },
    value: 20,
    description: "Cures burn from one ally.",
  },
  {
    id: "cartographer_staff",
    name: "Cartographer Staff",
    type: "weapon",
    effect: { stat: "atk", value: 5 },
    value: 120,
    description: "A balanced staff marked with route glyphs. ATK +5.",
  },
  {
    id: "ember_blade",
    name: "Ember Blade",
    type: "weapon",
    effect: { stat: "atk", value: 8 },
    value: 180,
    description: "A shrine-forged sword with a smoldering edge. ATK +8.",
  },
  {
    id: "oracle_core",
    name: "Oracle Core",
    type: "weapon",
    effect: { stat: "atk,mag", value: 3 },
    value: 200,
    description: "A machine focus that boosts ATK +3 and MAG +6.",
  },
  {
    id: "wind_charm",
    name: "Wind Charm",
    type: "charm",
    effect: { stat: "spd", value: 10 },
    value: 95,
    description: "A light charm that quickens its bearer. SPD +10.",
  },
  {
    id: "ember_charm",
    name: "Ember Charm",
    type: "charm",
    effect: { stat: "def", value: 10 },
    value: 95,
    description: "A warm charm that hardens resolve. DEF +10.",
  },
  {
    id: "arcane_charm",
    name: "Arcane Charm",
    type: "charm",
    effect: { stat: "mag", value: 10 },
    value: 95,
    description: "A humming charm etched with oracle code. MAG +10.",
  },
  {
    id: "skywell_shard",
    name: "Skywell Shard",
    type: "relic",
    effect: { stat: "resonancePercent", value: 20 },
    value: 300,
    description: "A relic that raises resonance gain by 20%.",
  },
  {
    id: "glass_lens",
    name: "Glass Lens",
    type: "relic",
    effect: { stat: "critPercent", value: 15 },
    value: 250,
    description: "A polished lens that improves critical chance by 15%.",
  },
  {
    id: "lighthouse_key",
    name: "Lighthouse Key",
    type: "key",
    effect: {},
    value: 0,
    description: "Unlocks the sealed lighthouse stair above the Mirrordrift.",
  },
];

export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((item) => [item.id, item]),
);
