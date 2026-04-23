import { FeaturePlaceholder } from '../../components/FeaturePlaceholder'

export function DamageCalcPage() {
  return (
    <FeaturePlaceholder
      title="Damage calculator reserved"
      eyebrow="Priority feature three"
      description="The calculator module is intentionally held back until the entity models are stable and the actual formula spec is available."
      items={[
        'Keep the calculator isolated from the Pokedex UI',
        'Reuse team and Pokemon entities instead of duplicating models',
        'Add golden tests once formula examples are supplied',
      ]}
      note="When you provide the formula later, this route already has a dedicated place in the app shell and deployment flow."
    />
  )
}