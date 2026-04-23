import {
  championsRegulationBaseStatsEntrySchema,
  championsRegulationMetaSchema,
  championsRegulationRosterEntrySchema,
  dataManifestSchema,
  pokemonPackSchema,
  regulationDexDataSchema,
  rulesetPackSchema,
  type ChampionsRegulationBaseStatsEntry,
  type ChampionsRegulationMeta,
  type ChampionsRegulationRosterEntry,
  type DataManifest,
  type PokemonPack,
  type RegulationDexData,
  type RulesetPack,
} from '../domain/data-contracts'

export type BootstrapData = {
  manifest: DataManifest
  pokemonPack: PokemonPack
  rulesetPack: RulesetPack
  regulationDexData: RegulationDexData
  source: 'override' | 'default'
}

const emptyRegulationDexData = regulationDexDataSchema.parse({
  abilities: {},
  items: {},
  moves: {},
  learnsets: {},
})

function hasOverrideContent(pokemonPack: PokemonPack, rulesetPack: RulesetPack) {
  return pokemonPack.pokemon.length > 0 || rulesetPack.rulesets.length > 0
}

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

async function readJson(path: string) {
  const response = await fetch(assetPath(path))

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function readJsonIfPresent(path: string) {
  const response = await fetch(assetPath(path))

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('json')) {
    const text = await response.text()

    // Vite dev can serve index.html for missing public assets under the app base path.
    if (/^\s*</.test(text)) {
      return null
    }

    throw new Error(`Expected JSON from ${path} but received ${contentType || 'unknown content type'}`)
  }

  return response.json()
}

async function loadPackFromManifest(
  manifestPath: string,
  source: 'override' | 'default',
): Promise<BootstrapData | null> {
  const manifestJson = source === 'override'
    ? await readJsonIfPresent(manifestPath)
    : await readJson(manifestPath)

  if (!manifestJson) {
    return null
  }

  const manifest = dataManifestSchema.parse(manifestJson)
  const pack = manifest.packs.find((entry) => entry.version === manifest.currentVersion)

  if (!pack) {
    throw new Error(`No data pack matched manifest version ${manifest.currentVersion}`)
  }

  if (pack.format === 'normalized-v1') {
    const [pokemonPack, rulesetPack] = await Promise.all([
      readJson(pack.pokemon).then((value) => pokemonPackSchema.parse(value)),
      readJson(pack.rulesets).then((value) => rulesetPackSchema.parse(value)),
    ])

    if (source === 'override' && !hasOverrideContent(pokemonPack, rulesetPack)) {
      return null
    }

    return {
      manifest,
      pokemonPack,
      rulesetPack,
      regulationDexData: emptyRegulationDexData,
      source,
    }
  }

  const [meta, roster, baseStats, abilities, items, moves, learnsets] = await Promise.all([
    readJson(pack.meta).then((value) => championsRegulationMetaSchema.parse(value)),
    readJson(pack.roster).then((value) =>
      championsRegulationRosterEntrySchema.array().parse(value),
    ),
    readJson(pack.baseStats).then((value) =>
      championsRegulationBaseStatsEntrySchema.array().parse(value),
    ),
    pack.abilities
      ? readJson(pack.abilities).then((value) => value as Array<{ name: string; description: string; championsVerified?: boolean }>)
      : Promise.resolve([]),
    pack.items
      ? readJson(pack.items).then((value) => value as Array<{ name: string; description: string }>)
      : Promise.resolve([]),
    pack.moves
      ? readJson(pack.moves).then((value) => value as Array<Record<string, unknown>>)
      : Promise.resolve([]),
    pack.learnsets
      ? readJson(pack.learnsets).then((value) => value as Record<string, unknown>)
      : Promise.resolve({}),
  ])

  const pokemonPack = normalizeRegulationPokemonPack(pack.regulation, meta, roster, baseStats)
  const rulesetPack = buildRegulationRulesetPack(pack.regulation, meta)
  const regulationDexData = regulationDexDataSchema.parse({
    abilities: Object.fromEntries(abilities.map((entry) => [entry.name, entry])),
    items: Object.fromEntries(items.map((entry) => [entry.name, entry])),
    moves: Object.fromEntries(
      moves.map((entry) => [String(entry.name), entry]),
    ),
    learnsets,
  })

  return {
    manifest,
    pokemonPack,
    rulesetPack,
    regulationDexData,
    source,
  }
}

export async function loadBootstrapData(): Promise<BootstrapData> {
  const userProvidedData = await loadPackFromManifest('data/user-provided/index.json', 'override')

  if (userProvidedData) {
    return userProvidedData
  }

  const sampleData = await loadPackFromManifest('data/index.json', 'default')

  if (!sampleData) {
    throw new Error('No default regulation pack was available at data/index.json')
  }

  return sampleData
}

function toEntryKey(entry: Pick<ChampionsRegulationRosterEntry, 'name' | 'form'>) {
  return `${entry.name}::${entry.form}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatDexNumber(dexNumber: number) {
  return dexNumber.toString().padStart(3, '0')
}

function buildFormGroups(roster: ChampionsRegulationRosterEntry[]) {
  const formsByDexNumber = new Map<number, PokemonPack['pokemon'][number]['forms']>()

  for (const entry of roster) {
    const currentForms = formsByDexNumber.get(entry.dexNumber) ?? []

    currentForms.push({
      id: slugify(`${entry.dexNumber}-${entry.form}`),
      name: entry.form,
      types: entry.types,
      tags: [entry.form.toLowerCase()],
    })

    formsByDexNumber.set(entry.dexNumber, currentForms)
  }

  return formsByDexNumber
}

function buildRegulationRulesetPack(
  regulation: string,
  meta: ChampionsRegulationMeta,
): RulesetPack {
  return rulesetPackSchema.parse({
    version: meta.version,
    rulesets: [
      {
        id: slugify(`regulation-${regulation}`),
        name: `Regulation ${regulation}`,
        status: 'active',
        description:
          `${meta.gameVersion} current regulation built from verified roster data updated ` +
          `${meta.lastUpdated}.`,
        tags: [
          `${meta.counts.pokemon} pokemon`,
          `${meta.counts.movesInChampions} legal moves`,
          `data v${meta.version}`,
        ],
      },
    ],
  })
}

function normalizeRegulationPokemonPack(
  regulation: string,
  meta: ChampionsRegulationMeta,
  roster: ChampionsRegulationRosterEntry[],
  baseStats: ChampionsRegulationBaseStatsEntry[],
): PokemonPack {
  const statsByEntryKey = new Map(baseStats.map((entry) => [toEntryKey(entry), entry]))
  const formsByDexNumber = buildFormGroups(roster)

  const pokemon = roster.map((entry, index) => {
    const stats = statsByEntryKey.get(toEntryKey(entry))

    if (!stats) {
      throw new Error(`Missing base stats for ${entry.name} (${entry.form}) in regulation ${regulation}`)
    }

    return {
      id: entry.dexNumber * 100 + index + 1,
      dexNumber: formatDexNumber(entry.dexNumber),
      name: entry.name,
      types: entry.types,
      stats: {
        hp: stats.hp,
        attack: stats.atk,
        defense: stats.def,
        specialAttack: stats.spa,
        specialDefense: stats.spd,
        speed: stats.spe,
      },
      abilities: Object.values(entry.abilities),
      forms: formsByDexNumber.get(entry.dexNumber) ?? [],
      tags: [entry.form.toLowerCase(), `regulation-${regulation.toLowerCase()}`],
      notes: entry.championsVerified
        ? `Verified for Regulation ${regulation}. Data updated ${meta.lastUpdated}.`
        : `Included in Regulation ${regulation}.`,
    }
  })

  return pokemonPackSchema.parse({
    version: meta.version,
    updatedAt: meta.lastUpdated,
    pokemon,
  })
}