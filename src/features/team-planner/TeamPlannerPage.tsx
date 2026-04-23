import { type KeyboardEvent as ReactKeyboardEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useChampdexData } from '../../app/champdex-data-context'
import type { PokemonEntry, RegulationDexData } from '../../domain/data-contracts'
import {
  getDisplayDexNumber,
  getPokemonCardHoverStyle,
  getPokemonImageUrl,
  getTypeCardHoverStyle,
  getTypeChipClass,
  shouldDisplayPokemon,
} from '../pokedex/pokedex-utils'

type StatKey = keyof PokemonEntry['stats']

type BattleSpread = Record<StatKey, number>

type TeamPlannerSlot = {
  id: number
  pokemonName: string | null
  abilityName: string | null
  itemName: string | null
  moveNames: string[]
  natureName: string
  statPoints: BattleSpread
}

type LegacyStoredTeamPlannerSlot = Partial<TeamPlannerSlot> & {
  evs?: Partial<BattleSpread>
  level?: number
  ivs?: Partial<BattleSpread>
}

type EditorPanel = 'pokemon' | 'ability' | 'item' | 'move' | null
type TeamTextModal = 'import' | 'export' | null

type AbilityDetail = RegulationDexData['abilities'][string]
type ItemDetail = RegulationDexData['items'][string]
type MoveDetail = RegulationDexData['moves'][string]

type NatureEntry = {
  name: string
  increasedStat: Exclude<StatKey, 'hp'> | null
  decreasedStat: Exclude<StatKey, 'hp'> | null
}

const TEAM_SLOT_COUNT = 6
const TEAM_MOVE_COUNT = 4
const TEAM_STORAGE_KEY = 'champdex.team-planner.v2'
const FIXED_LEVEL = 50
const DEFAULT_NATURE = 'Serious'
const MAX_STAT_POINTS_PER_STAT = 32
const MAX_STAT_POINTS_TOTAL = 66
const FIXED_IV = 31

const STAT_KEYS: StatKey[] = [
  'hp',
  'attack',
  'defense',
  'specialAttack',
  'specialDefense',
  'speed',
]

const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  specialAttack: 'SpA',
  specialDefense: 'SpD',
  speed: 'Spe',
}

const SHOWDOWN_STAT_LABEL_TO_KEY: Record<string, StatKey> = {
  HP: 'hp',
  Atk: 'attack',
  Def: 'defense',
  SpA: 'specialAttack',
  SpD: 'specialDefense',
  Spe: 'speed',
}

const DEFAULT_STAT_POINTS: BattleSpread = {
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
}

const NATURE_OPTIONS: NatureEntry[] = [
  { name: 'Adamant', increasedStat: 'attack', decreasedStat: 'specialAttack' },
  { name: 'Bashful', increasedStat: null, decreasedStat: null },
  { name: 'Bold', increasedStat: 'defense', decreasedStat: 'attack' },
  { name: 'Brave', increasedStat: 'attack', decreasedStat: 'speed' },
  { name: 'Calm', increasedStat: 'specialDefense', decreasedStat: 'attack' },
  { name: 'Careful', increasedStat: 'specialDefense', decreasedStat: 'specialAttack' },
  { name: 'Docile', increasedStat: null, decreasedStat: null },
  { name: 'Gentle', increasedStat: 'specialDefense', decreasedStat: 'defense' },
  { name: 'Hardy', increasedStat: null, decreasedStat: null },
  { name: 'Hasty', increasedStat: 'speed', decreasedStat: 'defense' },
  { name: 'Impish', increasedStat: 'defense', decreasedStat: 'specialAttack' },
  { name: 'Jolly', increasedStat: 'speed', decreasedStat: 'specialAttack' },
  { name: 'Lax', increasedStat: 'defense', decreasedStat: 'specialDefense' },
  { name: 'Lonely', increasedStat: 'attack', decreasedStat: 'defense' },
  { name: 'Mild', increasedStat: 'specialAttack', decreasedStat: 'defense' },
  { name: 'Modest', increasedStat: 'specialAttack', decreasedStat: 'attack' },
  { name: 'Naive', increasedStat: 'speed', decreasedStat: 'specialDefense' },
  { name: 'Naughty', increasedStat: 'attack', decreasedStat: 'specialDefense' },
  { name: 'Quiet', increasedStat: 'specialAttack', decreasedStat: 'speed' },
  { name: 'Quirky', increasedStat: null, decreasedStat: null },
  { name: 'Rash', increasedStat: 'specialAttack', decreasedStat: 'specialDefense' },
  { name: 'Relaxed', increasedStat: 'defense', decreasedStat: 'speed' },
  { name: 'Sassy', increasedStat: 'specialDefense', decreasedStat: 'speed' },
  { name: 'Serious', increasedStat: null, decreasedStat: null },
  { name: 'Timid', increasedStat: 'speed', decreasedStat: 'attack' },
]

function clampInteger(value: unknown, minimum: number, maximum: number, fallback = minimum) {
  const parsedValue =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? fallback), 10)

  if (!Number.isFinite(parsedValue)) {
    return minimum
  }

  return Math.max(minimum, Math.min(maximum, Math.trunc(parsedValue)))
}

function getEmptyStatPoints(): BattleSpread {
  return { ...DEFAULT_STAT_POINTS }
}

function normalizeSpread(
  value: unknown,
  defaults: BattleSpread,
  maximum: number,
  totalMaximum?: number,
) {
  const source = typeof value === 'object' && value !== null ? (value as Partial<BattleSpread>) : {}
  const normalized = STAT_KEYS.reduce((spread, statKey) => {
    spread[statKey] = clampInteger(source[statKey], defaults[statKey], maximum)
    return spread
  }, {} as BattleSpread)

  if (typeof totalMaximum !== 'number') {
    return normalized
  }

  let overflow = STAT_KEYS.reduce((total, statKey) => total + normalized[statKey], 0) - totalMaximum

  if (overflow <= 0) {
    return normalized
  }

  for (const statKey of [...STAT_KEYS].reverse()) {
    if (overflow <= 0) {
      break
    }

    const reduction = Math.min(normalized[statKey], overflow)
    normalized[statKey] -= reduction
    overflow -= reduction
  }

  return normalized
}

function createEmptySlot(id: number): TeamPlannerSlot {
  return {
    id,
    pokemonName: null,
    abilityName: null,
    itemName: null,
    moveNames: Array.from({ length: TEAM_MOVE_COUNT }, () => ''),
    natureName: DEFAULT_NATURE,
    statPoints: getEmptyStatPoints(),
  }
}

function createEmptyTeam(): TeamPlannerSlot[] {
  return Array.from({ length: TEAM_SLOT_COUNT }, (_, index) => createEmptySlot(index + 1))
}

function readStoredTeam(): TeamPlannerSlot[] {
  if (typeof window === 'undefined') {
    return createEmptyTeam()
  }

  try {
    const rawValue = window.localStorage.getItem(TEAM_STORAGE_KEY)

    if (!rawValue) {
      return createEmptyTeam()
    }

    const parsedValue = JSON.parse(rawValue) as LegacyStoredTeamPlannerSlot[]

    return Array.from({ length: TEAM_SLOT_COUNT }, (_, index) => {
      const slot = parsedValue[index]

      return {
        id: index + 1,
        pokemonName: typeof slot?.pokemonName === 'string' ? slot.pokemonName : null,
        abilityName: typeof slot?.abilityName === 'string' ? slot.abilityName : null,
        itemName: typeof slot?.itemName === 'string' ? slot.itemName : null,
        moveNames: Array.from({ length: TEAM_MOVE_COUNT }, (_, moveIndex) => {
          const moveName = slot?.moveNames?.[moveIndex]

          return typeof moveName === 'string' ? moveName : ''
        }),
        natureName:
          typeof slot?.natureName === 'string' &&
          NATURE_OPTIONS.some((nature) => nature.name === slot.natureName)
            ? slot.natureName
            : DEFAULT_NATURE,
        statPoints: normalizeSpread(
          slot?.statPoints ?? slot?.evs,
          DEFAULT_STAT_POINTS,
          MAX_STAT_POINTS_PER_STAT,
          MAX_STAT_POINTS_TOTAL,
        ),
      }
    })
  } catch {
    return createEmptyTeam()
  }
}

function sortPokemonByDex(
  left: { dexNumber: string; name: string },
  right: { dexNumber: string; name: string },
) {
  const dexDifference = Number(left.dexNumber) - Number(right.dexNumber)

  if (dexDifference !== 0) {
    return dexDifference
  }

  return left.name.localeCompare(right.name)
}

function matchesSearch(value: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return true
  }

  return value.toLowerCase().includes(normalizedQuery)
}

function formatMoveAccuracy(accuracy: number | null) {
  return accuracy === null ? '--' : `${accuracy}%`
}

function getFirstEmptyMoveSlotIndex(moveNames: string[]) {
  const firstEmptyIndex = moveNames.findIndex((moveName) => moveName.length === 0)

  return firstEmptyIndex === -1 ? 0 : firstEmptyIndex
}

function getNatureByName(name: string) {
  return NATURE_OPTIONS.find((nature) => nature.name === name) ?? NATURE_OPTIONS[23]
}

function getNatureModifier(statKey: Exclude<StatKey, 'hp'>, natureName: string) {
  const nature = getNatureByName(natureName)

  if (nature.increasedStat === statKey) {
    return 1.1
  }

  if (nature.decreasedStat === statKey) {
    return 0.9
  }

  return 1
}

function calculateActualStat(
  statKey: StatKey,
  baseStat: number,
  statPoints: number,
  natureName: string,
) {
  if (statKey === 'hp') {
    return (
      Math.floor(((2 * baseStat + FIXED_IV + Math.floor(statPoints / 4)) * FIXED_LEVEL) / 100) +
      FIXED_LEVEL +
      10
    )
  }

  const intermediate =
    Math.floor(((2 * baseStat + FIXED_IV + Math.floor(statPoints / 4)) * FIXED_LEVEL) / 100) + 5

  return Math.floor(intermediate * getNatureModifier(statKey, natureName))
}

function getTotalStatPoints(statPoints: BattleSpread) {
  return STAT_KEYS.reduce((total, statKey) => total + statPoints[statKey], 0)
}

function getNatureMarker(statKey: StatKey, natureName: string) {
  if (statKey === 'hp') {
    return 0
  }

  const nature = getNatureByName(natureName)

  if (nature.increasedStat === statKey) {
    return 1
  }

  if (nature.decreasedStat === statKey) {
    return -1
  }

  return 0
}

function isRowSelectionKey(event: ReactKeyboardEvent<HTMLTableRowElement>) {
  return event.key === 'Enter' || event.key === ' '
}

function formatStatPointsForExport(statPoints: BattleSpread) {
  const parts = STAT_KEYS.filter((statKey) => statPoints[statKey] > 0).map(
    (statKey) => `${statPoints[statKey]} ${STAT_LABELS[statKey]}`,
  )

  return parts.length > 0 ? `SPs: ${parts.join(' / ')}` : null
}

function formatSlotForExport(slot: TeamPlannerSlot, pokemon: PokemonEntry | null) {
  if (!pokemon) {
    return ''
  }

  const lines = [slot.itemName ? `${pokemon.name} @ ${slot.itemName}` : pokemon.name]

  if (slot.abilityName) {
    lines.push(`Ability: ${slot.abilityName}`)
  }

  const spreadLine = formatStatPointsForExport(slot.statPoints)

  if (spreadLine) {
    lines.push(spreadLine)
  }

  lines.push(`${slot.natureName} Nature`)

  for (const moveName of slot.moveNames) {
    if (moveName) {
      lines.push(`- ${moveName}`)
    }
  }

  return lines.join('\n')
}

function parseImportedSpread(rawValue: string) {
  const spread = getEmptyStatPoints()

  for (const segment of rawValue.split('/')) {
    const trimmedSegment = segment.trim()
    const match = trimmedSegment.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i)

    if (!match) {
      continue
    }

    const [, amount, showdownLabel] = match
    const statKey = SHOWDOWN_STAT_LABEL_TO_KEY[showdownLabel as keyof typeof SHOWDOWN_STAT_LABEL_TO_KEY]

    if (statKey) {
      spread[statKey] = Number.parseInt(amount, 10)
    }
  }

  return spread
}

function resolveImportedSpeciesName(headerLine: string, pokemonByName: Map<string, PokemonEntry>) {
  const withoutItem = headerLine.split('@')[0]?.trim() ?? ''

  if (pokemonByName.has(withoutItem)) {
    return withoutItem
  }

  const nicknameMatch = withoutItem.match(/\(([^()]+)\)$/)

  if (nicknameMatch) {
    const speciesName = nicknameMatch[1].trim()

    if (pokemonByName.has(speciesName)) {
      return speciesName
    }
  }

  const withoutGender = withoutItem.replace(/,\s*[MF]$/i, '').trim()

  if (pokemonByName.has(withoutGender)) {
    return withoutGender
  }

  return null
}

function navigateList(
  container: HTMLElement | null,
  direction: 'down' | 'up',
  fallbackInput?: HTMLElement | null,
) {
  if (!container) return
  const items = Array.from(
    container.querySelectorAll<HTMLElement>(':scope > button, :scope > tr[role="button"]'),
  )
  if (items.length === 0) return
  const currentIndex = items.indexOf(document.activeElement as HTMLElement)
  if (direction === 'down') {
    const next = items[currentIndex + 1] ?? items[0]
    next.focus()
  } else {
    if (currentIndex <= 0 && fallbackInput) {
      fallbackInput.focus()
    } else {
      const prev = items[currentIndex > 0 ? currentIndex - 1 : items.length - 1]
      prev.focus()
    }
  }
}

export function TeamPlannerPage() {
  const state = useChampdexData()
  const [teamSlots, setTeamSlots] = useState<TeamPlannerSlot[]>(() => createEmptyTeam())
  const [selectedSlotId, setSelectedSlotId] = useState(1)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [activePanel, setActivePanel] = useState<EditorPanel>('pokemon')
  const [activeTextModal, setActiveTextModal] = useState<TeamTextModal>(null)
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [pokemonSearch, setPokemonSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [moveSearch, setMoveSearch] = useState('')
  const [activeMoveSlotIndex, setActiveMoveSlotIndex] = useState(0)

  const pokemonSearchInputRef = useRef<HTMLInputElement>(null)
  const pokemonListRef = useRef<HTMLDivElement>(null)
  const itemSearchInputRef = useRef<HTMLInputElement>(null)
  const itemListRef = useRef<HTMLDivElement>(null)
  const moveSearchInputRef = useRef<HTMLInputElement>(null)
  const moveListRef = useRef<HTMLTableSectionElement>(null)

  const deferredPokemonSearch = useDeferredValue(pokemonSearch)
  const deferredItemSearch = useDeferredValue(itemSearch)
  const deferredMoveSearch = useDeferredValue(moveSearch)

  const availablePokemon = useMemo(() => {
    if (state.status !== 'ready') {
      return []
    }

    return [...state.data.pokemonPack.pokemon]
      .filter((entry) => shouldDisplayPokemon(entry.tags))
      .sort(sortPokemonByDex)
  }, [state])

  const pokemonByName = useMemo(() => {
    if (state.status !== 'ready') {
      return new Map<string, PokemonEntry>()
    }

    return new Map<string, PokemonEntry>(availablePokemon.map((pokemon) => [pokemon.name, pokemon]))
  }, [availablePokemon, state])

  const availableItems = useMemo(() => {
    if (state.status !== 'ready') {
      return [] as ItemDetail[]
    }

    return Object.values(state.data.regulationDexData.items)
      .filter((item) => item.inChampions !== false)
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [state])

  const abilityDetailsByName = useMemo(() => {
    if (state.status !== 'ready') {
      return new Map<string, AbilityDetail>()
    }

    return new Map<string, AbilityDetail>(
      Object.values(state.data.regulationDexData.abilities).map((ability) => [ability.name, ability]),
    )
  }, [state])

  const legalMoveDetailsByPokemon = useMemo(() => {
    if (state.status !== 'ready') {
      return new Map<string, MoveDetail[]>()
    }

    return new Map<string, MoveDetail[]>(
      availablePokemon.map((pokemon) => {
        const learnset = state.data.regulationDexData.learnsets[pokemon.name]
        const legalMoves = (learnset?.moves ?? [])
          .map((entry) => state.data.regulationDexData.moves[entry.name])
          .filter((move): move is MoveDetail => Boolean(move) && move.inChampions)
          .sort((left, right) => left.name.localeCompare(right.name))

        return [pokemon.name, legalMoves]
      }),
    )
  }, [availablePokemon, state])

  const sanitizeTeam = useMemo(() => {
    return (inputSlots: TeamPlannerSlot[]) => {
      const usedSpecies = new Set<string>()
      const usedItems = new Set<string>()
      const legalPokemonNames = new Set(availablePokemon.map((pokemon) => pokemon.name))
      const legalItemNames = new Set(availableItems.map((item) => item.name))

      return Array.from({ length: TEAM_SLOT_COUNT }, (_, index) => {
        const inputSlot = inputSlots[index] ?? createEmptySlot(index + 1)
        const pokemon = inputSlot.pokemonName ? pokemonByName.get(inputSlot.pokemonName) : undefined
        const canUseSpecies = Boolean(
          pokemon && legalPokemonNames.has(pokemon.name) && !usedSpecies.has(pokemon.name),
        )

        const pokemonName = canUseSpecies ? pokemon!.name : null

        if (pokemonName) {
          usedSpecies.add(pokemonName)
        }

        const abilityOptions = pokemon?.abilities ?? []
        const abilityName =
          pokemonName && inputSlot.abilityName && abilityOptions.includes(inputSlot.abilityName)
            ? inputSlot.abilityName
            : pokemonName
              ? abilityOptions[0] ?? null
              : null

        const canUseItem = Boolean(
          inputSlot.itemName &&
            legalItemNames.has(inputSlot.itemName) &&
            !usedItems.has(inputSlot.itemName),
        )

        const itemName = canUseItem ? inputSlot.itemName : null

        if (itemName) {
          usedItems.add(itemName)
        }

        const usedMoves = new Set<string>()
        const legalMoveNames = new Set(
          (pokemonName ? legalMoveDetailsByPokemon.get(pokemonName) ?? [] : []).map((move) => move.name),
        )
        const moveNames = Array.from({ length: TEAM_MOVE_COUNT }, (_, moveIndex) => {
          const moveName = inputSlot.moveNames[moveIndex]

          if (
            !pokemonName ||
            !moveName ||
            !legalMoveNames.has(moveName) ||
            usedMoves.has(moveName)
          ) {
            return ''
          }

          usedMoves.add(moveName)
          return moveName
        })

        return {
          id: index + 1,
          pokemonName,
          abilityName,
          itemName,
          moveNames,
          natureName: NATURE_OPTIONS.some((nature) => nature.name === inputSlot.natureName)
            ? inputSlot.natureName
            : DEFAULT_NATURE,
          statPoints: normalizeSpread(
            inputSlot.statPoints,
            DEFAULT_STAT_POINTS,
            MAX_STAT_POINTS_PER_STAT,
            MAX_STAT_POINTS_TOTAL,
          ),
        }
      })
    }
  }, [availableItems, availablePokemon, legalMoveDetailsByPokemon, pokemonByName])

  useEffect(() => {
    if (state.status !== 'ready' || hasHydrated) {
      return
    }

    setTeamSlots(sanitizeTeam(readStoredTeam()))
    setHasHydrated(true)
  }, [hasHydrated, sanitizeTeam, state.status])

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teamSlots))
  }, [hasHydrated, teamSlots])

  const selectedSlot = teamSlots.find((slot) => slot.id === selectedSlotId) ?? createEmptySlot(1)
  const selectedPokemon = selectedSlot.pokemonName
    ? pokemonByName.get(selectedSlot.pokemonName) ?? null
    : null

  useEffect(() => {
    setPokemonSearch('')
    setItemSearch('')
    setMoveSearch('')
    setActiveMoveSlotIndex(getFirstEmptyMoveSlotIndex(selectedSlot.moveNames))
  }, [selectedSlot.id, selectedSlot.moveNames])

  const selectedSlotSpecies = useMemo(
    () =>
      new Set(
        teamSlots
          .filter((slot) => slot.id !== selectedSlotId && slot.pokemonName)
          .map((slot) => slot.pokemonName as string),
      ),
    [selectedSlotId, teamSlots],
  )

  const selectedSlotItems = useMemo(
    () =>
      new Set(
        teamSlots
          .filter((slot) => slot.id !== selectedSlotId && slot.itemName)
          .map((slot) => slot.itemName as string),
      ),
    [selectedSlotId, teamSlots],
  )

  const selectablePokemon = availablePokemon.filter(
    (pokemon) => !selectedSlotSpecies.has(pokemon.name) || pokemon.name === selectedSlot.pokemonName,
  )

  const selectableItems = availableItems.filter(
    (item) => !selectedSlotItems.has(item.name) || item.name === selectedSlot.itemName,
  )

  const selectableMoveDetails = selectedPokemon
    ? legalMoveDetailsByPokemon.get(selectedPokemon.name) ?? []
    : []

  const filteredPokemon = useMemo(
    () =>
      selectablePokemon
        .filter((pokemon) =>
          matchesSearch(`${pokemon.name} ${pokemon.types.join(' ')} ${pokemon.dexNumber}`, deferredPokemonSearch),
        )
        .slice(0, 18),
    [deferredPokemonSearch, selectablePokemon],
  )

  const filteredItems = useMemo(
    () =>
      selectableItems
        .filter((item) => matchesSearch(`${item.name} ${item.description}`, deferredItemSearch))
        .slice(0, 14),
    [deferredItemSearch, selectableItems],
  )

  const filteredMoves = useMemo(() => {
    const activeMoveName = selectedSlot.moveNames[activeMoveSlotIndex] ?? ''
    const usedMoveNames = new Set(
      selectedSlot.moveNames.filter(
        (moveName, moveIndex) => moveIndex !== activeMoveSlotIndex && moveName.length > 0,
      ),
    )

    return selectableMoveDetails
      .filter((move) => !usedMoveNames.has(move.name) || move.name === activeMoveName)
      .filter((move) =>
        matchesSearch(
          `${move.name} ${move.type} ${move.category} ${move.description}`,
          deferredMoveSearch,
        ),
      )
      .slice(0, 16)
  }, [activeMoveSlotIndex, deferredMoveSearch, selectableMoveDetails, selectedSlot.moveNames])

  const derivedStats = useMemo(() => {
    if (!selectedPokemon) {
      return null
    }

    return STAT_KEYS.reduce((stats, statKey) => {
      stats[statKey] = calculateActualStat(
        statKey,
        selectedPokemon.stats[statKey],
        selectedSlot.statPoints[statKey],
        selectedSlot.natureName,
      )
      return stats
    }, {} as BattleSpread)
  }, [selectedPokemon, selectedSlot.statPoints, selectedSlot.natureName])

  const remainingStatPoints = MAX_STAT_POINTS_TOTAL - getTotalStatPoints(selectedSlot.statPoints)
  const exportText = useMemo(
    () =>
      teamSlots
        .map((slot) => formatSlotForExport(slot, slot.pokemonName ? pokemonByName.get(slot.pokemonName) ?? null : null))
        .filter((value) => value.length > 0)
        .join('\n\n'),
    [pokemonByName, teamSlots],
  )

  function updateSlot(slotId: number, updater: (slot: TeamPlannerSlot) => TeamPlannerSlot) {
    setTeamSlots((currentSlots) =>
      sanitizeTeam(currentSlots.map((slot) => (slot.id === slotId ? updater(slot) : slot))),
    )
  }

  function handlePokemonChange(nextPokemonName: string) {
    updateSlot(selectedSlot.id, (slot) => {
      if (nextPokemonName.length === 0) {
        return createEmptySlot(slot.id)
      }

      const nextPokemon = pokemonByName.get(nextPokemonName)

      return {
        ...slot,
        pokemonName: nextPokemonName,
        abilityName: nextPokemon?.abilities[0] ?? null,
        moveNames: Array.from({ length: TEAM_MOVE_COUNT }, () => ''),
      }
    })

    setActiveMoveSlotIndex(0)
    setPokemonSearch('')
    setMoveSearch('')
    setActivePanel(null)
  }

  function handleAbilityChange(nextAbilityName: string) {
    updateSlot(selectedSlot.id, (slot) => ({
      ...slot,
      abilityName: nextAbilityName || null,
    }))
  }

  function handleItemChange(nextItemName: string) {
    updateSlot(selectedSlot.id, (slot) => ({
      ...slot,
      itemName: nextItemName || null,
    }))

    setItemSearch('')
  }

  function handleMoveChange(moveIndex: number, nextMoveName: string) {
    updateSlot(selectedSlot.id, (slot) => ({
      ...slot,
      moveNames: slot.moveNames.map((moveName, index) =>
        index === moveIndex ? nextMoveName : moveName,
      ),
    }))
  }

  function handleMovePick(nextMoveName: string) {
    handleMoveChange(activeMoveSlotIndex, nextMoveName)
    setMoveSearch('')

    const nextMoveNames = selectedSlot.moveNames.map((moveName, moveIndex) =>
      moveIndex === activeMoveSlotIndex ? nextMoveName : moveName,
    )

    setActiveMoveSlotIndex(getFirstEmptyMoveSlotIndex(nextMoveNames))
  }

  function handleNatureChange(nextNatureName: string) {
    updateSlot(selectedSlot.id, (slot) => ({
      ...slot,
      natureName: NATURE_OPTIONS.some((nature) => nature.name === nextNatureName)
        ? nextNatureName
        : DEFAULT_NATURE,
    }))
  }

  function handleStatPointChange(statKey: StatKey, nextValue: string) {
    updateSlot(selectedSlot.id, (slot) => {
      const parsedValue = clampInteger(nextValue, 0, MAX_STAT_POINTS_PER_STAT)
      const totalWithoutCurrent = getTotalStatPoints(slot.statPoints) - slot.statPoints[statKey]
      const nextStatValue = Math.min(
        parsedValue,
        Math.max(0, MAX_STAT_POINTS_TOTAL - totalWithoutCurrent),
      )

      return {
        ...slot,
        statPoints: {
          ...slot.statPoints,
          [statKey]: nextStatValue,
        },
      }
    })
  }

  function clearCurrentSlot() {
    updateSlot(selectedSlot.id, (slot) => createEmptySlot(slot.id))
    setActiveMoveSlotIndex(0)
    setActivePanel(null)
  }

  function clearTeam() {
    setTeamSlots(createEmptyTeam())
    setSelectedSlotId(1)
    setActiveMoveSlotIndex(0)
    setActivePanel('pokemon')
  }

  function openImportModal() {
    setImportMessage(null)
    setActiveTextModal('import')
  }

  function openExportModal() {
    setActiveTextModal('export')
  }

  function closeTextModal() {
    setActiveTextModal(null)
    setImportMessage(null)
  }

  function importShowdownTeam() {
    const blocks = importText
      .split(/\r?\n\s*\r?\n/g)
      .map((block) => block.trim())
      .filter(Boolean)
    let hasLegacyEvWarning = false

    const importedSlots = Array.from({ length: TEAM_SLOT_COUNT }, (_, index) => {
      const slot = createEmptySlot(index + 1)
      const block = blocks[index]

      if (!block) {
        return slot
      }

      const lines = block
        .split(/\r?\n/g)
        .map((line) => line.trim())
        .filter(Boolean)

      const headerLine = lines[0] ?? ''
      const speciesName = resolveImportedSpeciesName(headerLine, pokemonByName)
      const itemMatch = headerLine.match(/@\s*(.+)$/)

      if (speciesName) {
        slot.pokemonName = speciesName
      }

      if (itemMatch) {
        slot.itemName = itemMatch[1].trim() || null
      }

      for (const line of lines.slice(1)) {
        if (/^Level:/i.test(line)) {
          continue
        }

        const abilityMatch = line.match(/^Ability:\s*(.+)$/i)

        if (abilityMatch) {
          slot.abilityName = abilityMatch[1].trim() || null
          continue
        }

        const spreadMatch = line.match(/^(SPs|EVs):\s*(.+)$/i)

        if (spreadMatch) {
          const [, spreadType, spreadValue] = spreadMatch
          const parsedSpread = parseImportedSpread(spreadValue)
          const spreadTotal = getTotalStatPoints(parsedSpread)

          if (spreadType.toUpperCase() === 'EVS' && spreadTotal > MAX_STAT_POINTS_TOTAL) {
            hasLegacyEvWarning = true
          } else {
            slot.statPoints = normalizeSpread(
              parsedSpread,
              DEFAULT_STAT_POINTS,
              MAX_STAT_POINTS_PER_STAT,
              MAX_STAT_POINTS_TOTAL,
            )
          }

          continue
        }

        const natureMatch = line.match(/^(.+)\s+Nature$/i)

        if (natureMatch) {
          slot.natureName = natureMatch[1].trim()
          continue
        }

        if (line.startsWith('- ')) {
          const nextMoveName = line.slice(2).trim()
          const targetIndex = slot.moveNames.findIndex((moveName) => moveName.length === 0)

          if (targetIndex !== -1) {
            slot.moveNames[targetIndex] = nextMoveName
          }
        }
      }

      return slot
    })

    setTeamSlots(sanitizeTeam(importedSlots))
    setSelectedSlotId(1)
    setActivePanel(null)

    if (hasLegacyEvWarning) {
      setImportMessage('Old system EVs detected, please set the Stat Points manually')
    } else {
      closeTextModal()
      setImportText('')
    }
  }

  function openEditor(slotId: number) {
    setSelectedSlotId(slotId)
    setActivePanel(null)
  }

  function togglePanel(nextPanel: EditorPanel) {
    setActivePanel((currentPanel) => (currentPanel === nextPanel ? null : nextPanel))
  }

  function openMovePanel(moveIndex: number) {
    setActiveMoveSlotIndex(moveIndex)
    setActivePanel('move')
  }

  if (state.status === 'loading') {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Loading team planner.
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        <strong>Data load failed.</strong> {state.message}
      </section>
    )
  }

  const showPokemonPicker = !selectedPokemon || activePanel === 'pokemon'
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-title text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Team Planner
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* Team sidebar */}
        <aside className="space-y-2">
          {teamSlots.map((slot) => {
            const pokemon = slot.pokemonName ? pokemonByName.get(slot.pokemonName) ?? null : null
            const isSelected = slot.id === selectedSlotId
            return (
              <button
                className={[
                  'pokemon-card-surface card-surface w-full rounded-xl p-3 text-left transition',
                  isSelected ? 'border-amber-500/60' : 'hover:border-slate-600',
                ].join(' ')}
                key={slot.id}
                onClick={() => openEditor(slot.id)}
                style={pokemon ? getPokemonCardHoverStyle(pokemon.types) : undefined}
                type="button"
              >
                <div className="flex items-center gap-3">
                  {pokemon ? (
                    <img
                      alt={pokemon.name}
                      className="h-12 w-12 shrink-0 object-contain"
                      loading="lazy"
                      src={getPokemonImageUrl(pokemon.dexNumber, pokemon.name, pokemon.tags)}
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 text-sm font-bold text-slate-600">
                      {slot.id}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={['truncate text-sm font-bold', pokemon ? 'text-white' : 'text-slate-600'].join(' ')}>
                      {pokemon?.name ?? 'Empty'}
                    </div>
                    {pokemon ? (
                      <>
                        <div className="mt-0.5 truncate text-xs text-slate-400">
                          {slot.itemName ?? 'No item'} · {slot.natureName}
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-x-2">
                          {slot.moveNames.map((move, i) => (
                            <span className="truncate text-[11px] text-slate-500" key={i}>
                              {move || '—'}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}

          <div className="flex gap-2 pt-1">
            <button
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              onClick={openImportModal}
              type="button"
            >
              Import
            </button>
            <button
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              onClick={openExportModal}
              type="button"
            >
              Export
            </button>
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:border-red-900 hover:text-red-400"
              onClick={clearTeam}
              type="button"
            >
              Clear
            </button>
          </div>
        </aside>

        {/* Editor */}
        <div className="min-w-0 space-y-3">
          {showPokemonPicker ? (
            <div className="panel-surface rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white">
                  {selectedPokemon
                    ? `Change Pokémon — ${selectedPokemon.name}`
                    : `Slot ${selectedSlotId} — Choose a Pokémon`}
                </h2>
                {selectedPokemon ? (
                  <button
                    className="text-sm text-slate-400 transition hover:text-white"
                    onClick={() => setActivePanel(null)}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
              <div className="mt-4">
                <input
                  className="field-surface w-full rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber-500"
                  onChange={(event) => setPokemonSearch(event.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      navigateList(pokemonListRef.current, 'down')
                    }
                  }}
                  placeholder="Search by name or type…"
                  ref={pokemonSearchInputRef}
                  type="search"
                  value={pokemonSearch}
                />
              </div>
              <div
                className="mt-4 grid max-h-104 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    navigateList(pokemonListRef.current, 'down')
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    navigateList(pokemonListRef.current, 'up', pokemonSearchInputRef.current)
                  }
                }}
                ref={pokemonListRef}
              >
                {filteredPokemon.map((pokemon) => (
                  <button
                    className={[
                      'pokemon-card-surface card-surface rounded-xl p-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70',
                      selectedSlot.pokemonName === pokemon.name ? 'border-amber-500/60' : '',
                    ].join(' ')}
                    key={pokemon.id}
                    onClick={() => handlePokemonChange(pokemon.name)}
                    style={getPokemonCardHoverStyle(pokemon.types)}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        alt={pokemon.name}
                        className="h-12 w-12 object-contain"
                        loading="lazy"
                        src={getPokemonImageUrl(pokemon.dexNumber, pokemon.name, pokemon.tags)}
                      />
                      <div>
                        <div className="text-[11px] text-slate-500">
                          #{getDisplayDexNumber(pokemon.dexNumber, pokemon.name, pokemon.tags)}
                        </div>
                        <div className="font-bold text-white">{pokemon.name}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pokemon.types.map((type) => (
                            <span
                              className={['rounded-full border px-2 py-0.5 text-[10px] font-medium', getTypeChipClass(type)].join(' ')}
                              key={type}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : selectedPokemon ? (
            <>
              {/* Pokemon header */}
              <div className="panel-surface-soft rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <img
                    alt={selectedPokemon.name}
                    className="h-16 w-16 shrink-0 object-contain"
                    src={getPokemonImageUrl(selectedPokemon.dexNumber, selectedPokemon.name, selectedPokemon.tags)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      #{getDisplayDexNumber(selectedPokemon.dexNumber, selectedPokemon.name, selectedPokemon.tags)} · Slot {selectedSlotId}
                    </div>
                    <div className="display-title mt-0.5 text-2xl font-extrabold text-white">
                      {selectedPokemon.name}
                    </div>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedPokemon.types.map((type) => (
                        <li
                          className={['rounded-full border px-2.5 py-0.5 text-xs font-medium', getTypeChipClass(type)].join(' ')}
                          key={type}
                        >
                          {type}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                      onClick={() => setActivePanel('pokemon')}
                      type="button"
                    >
                      Change
                    </button>
                    <button
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:border-red-900 hover:text-red-400"
                      onClick={clearCurrentSlot}
                      type="button"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Ability + Item */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Ability */}
                <div className="space-y-2">
                  <button
                    className={[
                      'w-full rounded-xl border p-4 text-left transition',
                      activePanel === 'ability'
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-slate-700 bg-[#0c1520] hover:border-slate-600',
                    ].join(' ')}
                    onClick={() => togglePanel('ability')}
                    type="button"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Ability</div>
                    <div className="mt-1 text-base font-bold text-white">{selectedSlot.abilityName ?? '—'}</div>
                    {selectedSlot.abilityName ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {abilityDetailsByName.get(selectedSlot.abilityName)?.description}
                      </p>
                    ) : null}
                  </button>
                  {activePanel === 'ability' ? (
                    <div className="panel-surface-soft rounded-xl p-2">
                      {selectedPokemon.abilities.map((ability) => (
                        <button
                          className={[
                            'w-full rounded-lg px-3 py-2.5 text-left transition',
                            selectedSlot.abilityName === ability
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'text-slate-200 hover:bg-white/5 hover:text-white',
                          ].join(' ')}
                          key={ability}
                          onClick={() => {
                            handleAbilityChange(ability)
                            setActivePanel(null)
                          }}
                          type="button"
                        >
                          <div className="font-semibold">{ability}</div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {abilityDetailsByName.get(ability)?.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Item */}
                <div className="space-y-2">
                  <button
                    className={[
                      'w-full rounded-xl border p-4 text-left transition',
                      activePanel === 'item'
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-slate-700 bg-[#0c1520] hover:border-slate-600',
                    ].join(' ')}
                    onClick={() => togglePanel('item')}
                    type="button"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Item</div>
                    <div className="mt-1 text-base font-bold text-white">{selectedSlot.itemName ?? 'No item'}</div>
                  </button>
                  {activePanel === 'item' ? (
                    <div className="panel-surface-soft rounded-xl p-3">
                      <input
                        className="field-surface w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500"
                        onChange={(event) => setItemSearch(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            navigateList(itemListRef.current, 'down')
                          }
                        }}
                        placeholder="Search items…"
                        ref={itemSearchInputRef}
                        type="search"
                        value={itemSearch}
                      />
                      <div
                        className="mt-2 max-h-56 overflow-y-auto"
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            navigateList(itemListRef.current, 'down')
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            navigateList(itemListRef.current, 'up', itemSearchInputRef.current)
                          }
                        }}
                        ref={itemListRef}
                      >
                        <button
                          className={[
                            'w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70',
                            selectedSlot.itemName === null
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white',
                          ].join(' ')}
                          onClick={() => {
                            handleItemChange('')
                            setActivePanel(null)
                          }}
                          type="button"
                        >
                          <span className="font-semibold">No item</span>
                          <span className="ml-2 text-xs text-slate-500">Clear held item</span>
                        </button>
                        {filteredItems.map((item) => (
                          <button
                            className={[
                              'w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70',
                              selectedSlot.itemName === item.name
                                ? 'bg-amber-500/10 text-amber-300'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white',
                            ].join(' ')}
                            key={item.name}
                            onClick={() => {
                              handleItemChange(item.name)
                              setActivePanel(null)
                            }}
                            type="button"
                          >
                            <div className="font-semibold">{item.name}</div>
                            <div className="line-clamp-1 text-xs text-slate-500">{item.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Moves */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  {selectedSlot.moveNames.map((moveName, moveIndex) => {
                    const moveDetail = moveName
                      ? selectableMoveDetails.find((m) => m.name === moveName) ?? null
                      : null
                    const isActive = activePanel === 'move' && activeMoveSlotIndex === moveIndex
                    return (
                      <button
                        className={[
                          'card-surface rounded-xl p-4 text-left transition',
                          isActive ? 'border-amber-500/50' : 'hover:border-slate-600',
                        ].join(' ')}
                        key={moveIndex}
                        onClick={() => openMovePanel(moveIndex)}
                        style={moveDetail ? getTypeCardHoverStyle(moveDetail.type) : undefined}
                        type="button"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                          Move {moveIndex + 1}
                        </div>
                        {moveName ? (
                          <>
                            <div className="mt-1 font-bold text-white">{moveName}</div>
                            {moveDetail ? (
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className={['rounded-full border px-2 py-0.5 text-[10px] font-medium', getTypeChipClass(moveDetail.type)].join(' ')}>
                                  {moveDetail.type}
                                </span>
                                <span className="text-xs text-slate-400">{moveDetail.category}</span>
                                {moveDetail.power > 0 ? (
                                  <span className="text-xs text-slate-400">{moveDetail.power} BP</span>
                                ) : null}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div className="mt-1 text-slate-500">—</div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {activePanel === 'move' ? (
                  <div className="panel-surface-soft rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <input
                        className="field-surface min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500"
                        onChange={(event) => setMoveSearch(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            navigateList(moveListRef.current, 'down')
                          }
                        }}
                        placeholder="Search moves…"
                        ref={moveSearchInputRef}
                        type="search"
                        value={moveSearch}
                      />
                      {selectedSlot.moveNames[activeMoveSlotIndex] ? (
                        <button
                          className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:text-red-400"
                          onClick={() => {
                            handleMoveChange(activeMoveSlotIndex, '')
                            setActivePanel(null)
                          }}
                          type="button"
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 max-h-64 overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-[#0c1520]">
                          <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                            <th className="px-3 py-2 text-left">Move</th>
                            <th className="px-3 py-2 text-left">Type</th>
                            <th className="px-3 py-2 text-left">Cat</th>
                            <th className="px-3 py-2 text-right">Pwr</th>
                            <th className="px-3 py-2 text-right">Acc</th>
                            <th className="px-3 py-2 text-right">PP</th>
                          </tr>
                        </thead>
                        <tbody
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault()
                              navigateList(moveListRef.current, 'down')
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault()
                              navigateList(moveListRef.current, 'up', moveSearchInputRef.current)
                            }
                          }}
                          ref={moveListRef}
                        >
                          {filteredMoves.map((move) => {
                            const isSelected = move.name === (selectedSlot.moveNames[activeMoveSlotIndex] ?? '')
                            return (
                              <tr
                                className={[
                                  'cursor-pointer border-b border-white/5 transition last:border-b-0 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500/70',
                                  isSelected ? 'bg-amber-500/10' : '',
                                ].join(' ')}
                                key={move.name}
                                onClick={() => {
                                  handleMovePick(move.name)
                                  setActivePanel(null)
                                }}
                                onKeyDown={(event) => {
                                  if (isRowSelectionKey(event)) {
                                    event.preventDefault()
                                    handleMovePick(move.name)
                                    setActivePanel(null)
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <td className={['px-3 py-2.5 font-semibold', isSelected ? 'text-amber-300' : 'text-white'].join(' ')}>
                                  {move.name}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={['rounded-full border px-2 py-0.5 text-[10px] font-medium', getTypeChipClass(move.type)].join(' ')}>
                                    {move.type}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-slate-300">{move.category}</td>
                                <td className="px-3 py-2.5 text-right text-slate-300">{move.power || '—'}</td>
                                <td className="px-3 py-2.5 text-right text-slate-300">{formatMoveAccuracy(move.accuracy)}</td>
                                <td className="px-3 py-2.5 text-right text-slate-300">{move.pp}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Stats */}
              <div className="panel-surface-soft rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">Stats</h3>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {MAX_STAT_POINTS_TOTAL - remainingStatPoints} / {MAX_STAT_POINTS_TOTAL} SP allocated
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">Nature</span>
                    <select
                      className="field-surface rounded-xl px-3 py-2 text-white focus:border-amber-500"
                      onChange={(event) => handleNatureChange(event.target.value)}
                      value={selectedSlot.natureName}
                    >
                      {NATURE_OPTIONS.map((nature) => (
                        <option className="bg-[#0a0f18] text-white" key={nature.name} value={nature.name}>
                          {nature.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        <th className="pb-2 pr-4 text-left">Stat</th>
                        <th className="pb-2 pr-4 text-right">Base</th>
                        <th className="pb-2 pr-4 text-left" style={{ minWidth: '8rem' }}>SPs</th>
                        <th className="pb-2 text-right">Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {STAT_KEYS.map((statKey) => {
                        const natureMarker = getNatureMarker(statKey, selectedSlot.natureName)
                        const statColor =
                          natureMarker > 0
                            ? 'text-emerald-400'
                            : natureMarker < 0
                              ? 'text-rose-400'
                              : 'text-white'
                        const fillColor =
                          natureMarker > 0
                            ? 'bg-emerald-400'
                            : natureMarker < 0
                              ? 'bg-rose-400'
                              : 'bg-amber-500'
                        const fillPct = (selectedSlot.statPoints[statKey] / MAX_STAT_POINTS_PER_STAT) * 100
                        return (
                          <tr key={statKey}>
                            <td className="py-2.5 pr-4">
                              <span className={['text-sm font-bold', statColor].join(' ')}>
                                {STAT_LABELS[statKey]}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-right tabular-nums text-slate-400">
                              {selectedPokemon.stats[statKey]}
                            </td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="relative h-4 w-full min-w-16">
                                  <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                      className={['h-full rounded-full transition-all', fillColor].join(' ')}
                                      style={{ width: `${fillPct}%` }}
                                    />
                                  </div>
                                  <div
                                    className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-900 bg-white shadow-sm transition-all"
                                    style={{ left: `${fillPct}%` }}
                                  />
                                  <input
                                    aria-label={`${STAT_LABELS[statKey]} stat points`}
                                    className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent opacity-0"
                                    max={32}
                                    min={0}
                                    onChange={(event) => handleStatPointChange(statKey, event.target.value)}
                                    step={1}
                                    type="range"
                                    value={selectedSlot.statPoints[statKey]}
                                  />
                                </div>
                                <input
                                  className="field-surface w-14 rounded-lg px-2 py-1 text-center text-sm text-white focus:border-amber-500"
                                  max={32}
                                  min={0}
                                  onChange={(event) => handleStatPointChange(statKey, event.target.value)}
                                  type="number"
                                  value={selectedSlot.statPoints[statKey]}
                                />
                              </div>
                            </td>
                            <td className={['py-2.5 text-right text-base font-bold tabular-nums', statColor].join(' ')}>
                              {derivedStats?.[statKey] ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {activeTextModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <div className="panel-surface w-full max-w-3xl rounded-2xl p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeTextModal === 'export' ? 'Export Team' : 'Import Team'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {activeTextModal === 'export'
                    ? 'Showdown-style export for the current team.'
                    : 'Paste a Showdown-style team import here.'}
                </p>
              </div>
              <button
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                onClick={closeTextModal}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-5">
              <textarea
                className="field-surface min-h-80 w-full rounded-xl px-4 py-4 font-mono text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Palafin @ Focus Sash&#10;Ability: Zero to Hero&#10;SPs: 2 HP / 32 Atk / 32 Spe&#10;Adamant Nature&#10;- Acrobatics&#10;- Agility&#10;- Aqua Tail&#10;- Body Slam"
                readOnly={activeTextModal === 'export'}
                value={activeTextModal === 'export' ? exportText : importText}
              />
            </div>
            {activeTextModal === 'import' && importMessage ? (
              <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {importMessage}
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-3">
              {activeTextModal === 'import' ? (
                <button
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
                  onClick={importShowdownTeam}
                  type="button"
                >
                  Import Team
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
