import type { CSSProperties } from 'react'
import type { PokemonEntry } from '../../domain/data-contracts'

type PokemonGradientTokens = {
  start: string
  end: string
  border: string
}

const typeColorClasses: Record<string, string> = {
  Bug: 'border-lime-500/40 bg-lime-950/80 text-lime-100',
  Dark: 'border-slate-500/60 bg-slate-900 text-slate-100',
  Dragon: 'border-indigo-500/45 bg-indigo-950/80 text-indigo-100',
  Electric: 'border-amber-500/45 bg-amber-950/80 text-amber-100',
  Fairy: 'border-pink-500/45 bg-pink-950/80 text-pink-100',
  Fighting: 'border-red-500/45 bg-red-950/80 text-red-100',
  Fire: 'border-orange-500/45 bg-orange-950/80 text-orange-100',
  Flying: 'border-sky-500/45 bg-sky-950/80 text-sky-100',
  Ghost: 'border-violet-500/45 bg-violet-950/80 text-violet-100',
  Grass: 'border-emerald-500/45 bg-emerald-950/80 text-emerald-100',
  Ground: 'border-yellow-700/50 bg-yellow-950/80 text-yellow-100',
  Ice: 'border-cyan-500/45 bg-cyan-950/80 text-cyan-100',
  Normal: 'border-stone-500/45 bg-stone-900/90 text-stone-100',
  Poison: 'border-fuchsia-500/45 bg-fuchsia-950/80 text-fuchsia-100',
  Psychic: 'border-rose-500/45 bg-rose-950/80 text-rose-100',
  Rock: 'border-amber-700/50 bg-amber-950/80 text-amber-100',
  Steel: 'border-slate-400/45 bg-slate-800/95 text-slate-100',
  Water: 'border-blue-500/45 bg-blue-950/80 text-blue-100',
}

const typeHoverColors: Record<string, { start: string; end: string; border: string }> = {
  Bug: { start: 'rgba(101, 163, 13, 0.22)', end: 'rgba(77, 124, 15, 0.1)', border: 'rgba(163, 230, 53, 0.4)' },
  Dark: { start: 'rgba(71, 85, 105, 0.22)', end: 'rgba(30, 41, 59, 0.1)', border: 'rgba(148, 163, 184, 0.35)' },
  Dragon: { start: 'rgba(79, 70, 229, 0.24)', end: 'rgba(49, 46, 129, 0.1)', border: 'rgba(129, 140, 248, 0.4)' },
  Electric: { start: 'rgba(245, 158, 11, 0.24)', end: 'rgba(146, 64, 14, 0.1)', border: 'rgba(251, 191, 36, 0.45)' },
  Fairy: { start: 'rgba(236, 72, 153, 0.22)', end: 'rgba(131, 24, 67, 0.1)', border: 'rgba(244, 114, 182, 0.4)' },
  Fighting: { start: 'rgba(220, 38, 38, 0.22)', end: 'rgba(127, 29, 29, 0.1)', border: 'rgba(248, 113, 113, 0.42)' },
  Fire: { start: 'rgba(234, 88, 12, 0.25)', end: 'rgba(124, 45, 18, 0.1)', border: 'rgba(251, 146, 60, 0.45)' },
  Flying: { start: 'rgba(14, 165, 233, 0.22)', end: 'rgba(12, 74, 110, 0.1)', border: 'rgba(125, 211, 252, 0.4)' },
  Ghost: { start: 'rgba(124, 58, 237, 0.22)', end: 'rgba(76, 29, 149, 0.1)', border: 'rgba(167, 139, 250, 0.42)' },
  Grass: { start: 'rgba(22, 163, 74, 0.22)', end: 'rgba(20, 83, 45, 0.1)', border: 'rgba(74, 222, 128, 0.4)' },
  Ground: { start: 'rgba(161, 98, 7, 0.22)', end: 'rgba(113, 63, 18, 0.1)', border: 'rgba(250, 204, 21, 0.38)' },
  Ice: { start: 'rgba(6, 182, 212, 0.22)', end: 'rgba(22, 78, 99, 0.1)', border: 'rgba(103, 232, 249, 0.4)' },
  Normal: { start: 'rgba(120, 113, 108, 0.2)', end: 'rgba(68, 64, 60, 0.08)', border: 'rgba(214, 211, 209, 0.3)' },
  Poison: { start: 'rgba(192, 38, 211, 0.22)', end: 'rgba(112, 26, 117, 0.1)', border: 'rgba(232, 121, 249, 0.4)' },
  Psychic: { start: 'rgba(244, 63, 94, 0.22)', end: 'rgba(136, 19, 55, 0.1)', border: 'rgba(251, 113, 133, 0.42)' },
  Rock: { start: 'rgba(180, 83, 9, 0.22)', end: 'rgba(120, 53, 15, 0.1)', border: 'rgba(251, 191, 36, 0.35)' },
  Steel: { start: 'rgba(100, 116, 139, 0.22)', end: 'rgba(51, 65, 85, 0.1)', border: 'rgba(203, 213, 225, 0.35)' },
  Water: { start: 'rgba(37, 99, 235, 0.22)', end: 'rgba(30, 64, 175, 0.1)', border: 'rgba(96, 165, 250, 0.42)' },
}

export function getFormSuffix(name: string, tags: string[]) {
  if (tags.includes('base')) {
    return ''
  }

  if (tags.includes('mega')) {
    const megaVariantMatch = name.trim().match(/\b([A-Za-z])$/)

    if (megaVariantMatch) {
      return `-m${megaVariantMatch[1].toLowerCase()}`
    }

    return '-m'
  }

  return `-${name.trim().charAt(0).toLowerCase()}`
}

export function getPokemonSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getDisplayDexNumber(dexNumber: string, name: string, tags: string[]) {
  return `${dexNumber.padStart(4, '0')}${getFormSuffix(name, tags)}`
}

export function getPokemonImageUrl(dexNumber: string, name: string, tags: string[]) {
  return `https://www.serebii.net/pokemonhome/pokemon/${dexNumber}${getFormSuffix(name, tags)}.png`
}

export function shouldDisplayPokemon(tags: string[]) {
  return !tags.includes('mega')
}

export function hasMegaForm(entry: PokemonEntry) {
  return entry.forms.some((form) => form.tags.includes('mega'))
}

export function getTypeChipClass(type: string) {
  return typeColorClasses[type] ?? 'border-slate-700 bg-slate-900 text-slate-100'
}

export function getPokemonGradientTokens(types: string[]): PokemonGradientTokens {
  const primary = typeHoverColors[types[0]] ?? typeHoverColors.Normal
  const secondary = typeHoverColors[types[1] ?? types[0]] ?? primary

  return {
    start: primary.start,
    end: secondary.start,
    border: primary.border,
  }
}

export function getPokemonCardHoverStyle(types: string[]): CSSProperties {
  const gradient = getPokemonGradientTokens(types)

  return {
    '--card-hover-start': gradient.start,
    '--card-hover-end': gradient.end,
    '--card-hover-border': gradient.border,
  } as CSSProperties
}

export function getTypeCardHoverStyle(type: string): CSSProperties {
  return getPokemonCardHoverStyle([type])
}

export function getPokemonPageGradientStyle(types: string[]): CSSProperties {
  const gradient = getPokemonGradientTokens(types)

  return {
    '--card-hover-start': gradient.start,
    '--card-hover-end': gradient.end,
    '--card-hover-border': gradient.border,
  } as CSSProperties
}