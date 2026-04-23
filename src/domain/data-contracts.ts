import { z } from 'zod'

const statsSchema = z.object({
  hp: z.number().int().nonnegative(),
  attack: z.number().int().nonnegative(),
  defense: z.number().int().nonnegative(),
  specialAttack: z.number().int().nonnegative(),
  specialDefense: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
})

const formSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  types: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).default([]),
})

const abilityDetailSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  championsVerified: z.boolean().optional(),
})

const itemDetailSchema = z.object({
  name: z.string().min(1),
  description: z.string().transform((value) => value.trim() || 'No description available.'),
  inChampions: z.boolean().optional(),
})

const moveDetailSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  category: z.string().min(1),
  description: z.string().transform((value) => value.trim() || 'No description available.'),
  target: z.string().min(1),
  inChampions: z.boolean(),
  championsVerified: z.boolean(),
  power: z.number().int().nonnegative(),
  accuracy: z.preprocess(
    (value) => {
      if (typeof value === 'boolean') {
        return null
      }

      return value
    },
    z.number().int().positive().nullable(),
  ),
  pp: z.number().int().nonnegative(),
  priority: z.number().int(),
  championsChanges: z.string().optional(),
})

const learnsetMoveSchema = z.object({
  name: z.string().min(1),
})

const learnsetEntrySchema = z.object({
  dexNumber: z.number().int().positive(),
  form: z.string().min(1),
  championsVerified: z.boolean(),
  source: z.string().min(1),
  moves: z.array(learnsetMoveSchema),
  moveCount: z.number().int().nonnegative(),
})

export const pokemonEntrySchema = z.object({
  id: z.number().int().positive(),
  dexNumber: z.string().min(1),
  name: z.string().min(1),
  types: z.array(z.string().min(1)).min(1),
  stats: statsSchema,
  abilities: z.array(z.string().min(1)).min(1),
  forms: z.array(formSchema).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(''),
})

export const pokemonPackSchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string().min(1),
  pokemon: z.array(pokemonEntrySchema),
})

export const rulesetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(['active', 'preview', 'archived']),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
})

export const rulesetPackSchema = z.object({
  version: z.string().min(1),
  rulesets: z.array(rulesetSchema),
})

export const regulationDexDataSchema = z.object({
  abilities: z.record(z.string(), abilityDetailSchema),
  items: z.record(z.string(), itemDetailSchema),
  moves: z.record(z.string(), moveDetailSchema),
  learnsets: z.record(z.string(), learnsetEntrySchema),
})

export const championsRegulationMetaSchema = z.object({
  version: z.string().min(1),
  lastUpdated: z.string().min(1),
  gameVersion: z.string().min(1),
  dataFormat: z.string().min(1),
  sources: z.array(z.string()).default([]),
  verification: z.object({
    description: z.string().min(1),
    stats: z.object({
      pokemon_verified: z.number().int().nonnegative(),
      pokemon_total: z.number().int().nonnegative(),
      abilities_verified: z.number().int().nonnegative(),
      abilities_total: z.number().int().nonnegative(),
      moves_verified: z.number().int().nonnegative(),
      moves_in_champions: z.number().int().nonnegative(),
      moves_total: z.number().int().nonnegative(),
      learnsets_verified: z.number().int().nonnegative(),
      learnsets_total: z.number().int().nonnegative(),
    }),
    moveCorrectionSummary: z.object({
      ppChanges: z.number().int().nonnegative(),
      powerChanges: z.number().int().nonnegative(),
      accuracyChanges: z.number().int().nonnegative(),
      notInChampions: z.number().int().nonnegative(),
    }),
  }),
  counts: z.object({
    pokemon: z.number().int().nonnegative(),
    movesInChampions: z.number().int().nonnegative(),
    movesTotal: z.number().int().nonnegative(),
    abilities: z.number().int().nonnegative(),
    items: z.number().int().nonnegative(),
    natures: z.number().int().nonnegative(),
    types: z.number().int().nonnegative(),
  }),
})

export const championsRegulationRosterEntrySchema = z.object({
  name: z.string().min(1),
  dexNumber: z.number().int().positive(),
  types: z.array(z.string().min(1)).min(1),
  form: z.string().min(1),
  abilities: z.record(z.string(), z.string().min(1)),
  championsVerified: z.boolean(),
})

export const championsRegulationBaseStatsEntrySchema = z.object({
  name: z.string().min(1),
  dexNumber: z.number().int().positive(),
  form: z.string().min(1),
  hp: z.number().int().nonnegative(),
  atk: z.number().int().nonnegative(),
  def: z.number().int().nonnegative(),
  spa: z.number().int().nonnegative(),
  spd: z.number().int().nonnegative(),
  spe: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  championsVerified: z.boolean(),
})

const normalizedPackReferenceSchema = z.object({
  version: z.string().min(1),
  label: z.string().min(1).optional(),
  format: z.literal('normalized-v1'),
  pokemon: z.string().min(1),
  rulesets: z.string().min(1),
})

const championsRegulationPackReferenceSchema = z.object({
  version: z.string().min(1),
  label: z.string().min(1).optional(),
  format: z.literal('champions-regulation-v1'),
  regulation: z.string().min(1),
  meta: z.string().min(1),
  roster: z.string().min(1),
  baseStats: z.string().min(1),
  abilities: z.string().min(1).optional(),
  items: z.string().min(1).optional(),
  learnsets: z.string().min(1).optional(),
  moves: z.string().min(1).optional(),
  natures: z.string().min(1).optional(),
  typeChart: z.string().min(1).optional(),
})

export const dataManifestSchema = z.object({
  currentVersion: z.string().min(1),
  label: z.string().min(1),
  packs: z.array(
    z.discriminatedUnion('format', [
      normalizedPackReferenceSchema,
      championsRegulationPackReferenceSchema,
    ]),
  ),
})

export type DataManifest = z.infer<typeof dataManifestSchema>
export type PokemonEntry = z.infer<typeof pokemonEntrySchema>
export type PokemonPack = z.infer<typeof pokemonPackSchema>
export type RulesetPack = z.infer<typeof rulesetPackSchema>
export type RegulationDexData = z.infer<typeof regulationDexDataSchema>
export type ChampionsRegulationMeta = z.infer<typeof championsRegulationMetaSchema>
export type ChampionsRegulationRosterEntry = z.infer<typeof championsRegulationRosterEntrySchema>
export type ChampionsRegulationBaseStatsEntry = z.infer<
  typeof championsRegulationBaseStatsEntrySchema
>