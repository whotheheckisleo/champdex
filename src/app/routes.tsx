import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { AbilityDexPage } from '../features/abilities/AbilityDexPage'
import { AbilityDetailPage } from '../features/abilities/AbilityDetailPage'
import { AboutPage } from '../features/about/AboutPage'
import { HomePage } from '../features/home/HomePage'
import { ItemsDexPage } from '../features/items/ItemsDexPage'
import { MoveDetailPage } from '../features/moves/MoveDetailPage'
import { MovesDexPage } from '../features/moves/MovesDexPage'
import { PokedexPage } from '../features/pokedex/PokedexPage'
import { PokemonDetailPage } from '../features/pokedex/PokemonDetailPage'
import { TeamPlannerPage } from '../features/team-planner/TeamPlannerPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/dex" element={<PokedexPage />} />
        <Route path="/dex/pokemon/:pokemonSlug" element={<PokemonDetailPage />} />
        <Route path="/dex/abilities" element={<AbilityDexPage />} />
        <Route path="/dex/abilities/:abilitySlug" element={<AbilityDetailPage />} />
        <Route path="/dex/items" element={<ItemsDexPage />} />
        <Route path="/dex/moves" element={<MovesDexPage />} />
        <Route path="/dex/moves/:moveSlug" element={<MoveDetailPage />} />
        <Route path="/pokedex" element={<Navigate replace to="/dex" />} />
        <Route path="/team-planner" element={<TeamPlannerPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  )
}