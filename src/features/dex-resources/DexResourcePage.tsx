type DexResourcePageProps = {
  title: string
  description: string
}

export function DexResourcePage({ title, description }: DexResourcePageProps) {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 text-center">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
      </div>
    </section>
  )
}