"use client"

import type React from "react"
import { useState, useMemo, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toPng } from "html-to-image"
import type { PokemonTypeName, PokemonData, GithubUser } from "@/types"

const TYPE_THEME: Record<PokemonTypeName, { from: string; to: string }> = {
  normal: { from: "from-stone-200", to: "to-stone-300" },
  fire: { from: "from-orange-500", to: "to-red-500" },
  water: { from: "from-sky-500", to: "to-blue-600" },
  electric: { from: "from-yellow-400", to: "to-amber-500" },
  grass: { from: "from-emerald-500", to: "to-green-600" },
  ice: { from: "from-cyan-300", to: "to-sky-300" },
  fighting: { from: "from-rose-600", to: "to-orange-700" },
  poison: { from: "from-fuchsia-600", to: "to-purple-700" },
  ground: { from: "from-amber-700", to: "to-yellow-800" },
  flying: { from: "from-indigo-400", to: "to-sky-400" },
  psychic: { from: "from-pink-500", to: "to-purple-600" },
  bug: { from: "from-lime-500", to: "to-green-600" },
  rock: { from: "from-yellow-800", to: "to-stone-700" },
  ghost: { from: "from-gray-800", to: "from-gray-900" },
  dragon: { from: "from-indigo-700", to: "to-blue-800" },
  dark: { from: "from-neutral-900", to: "to-neutral-800" },
  steel: { from: "from-zinc-400", to: "to-neutral-500" },
  fairy: { from: "from-rose-400", to: "to-pink-500" },
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function usernameToGen1Id(u: string) {
  // stable 1–151 id based on username
  let sum = 0
  for (let i = 0; i < u.length; i++) sum = (sum + u.charCodeAt(i)) % 10000
  return (sum % 151) + 1
}

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors", cache: "no-cache" })
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function Page() {
  // UI state
  const [username, setUsername] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Data state
  const [githubUser, setGithubUser] = useState<GithubUser | null>(null)
  const [pokemon, setPokemon] = useState<PokemonData | null>(null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [spriteSrc, setSpriteSrc] = useState<string | null>(null)
  const [commitCount, setCommitCount] = useState<number | null>(null)

  // Loading/error state
  const [loadingUser, setLoadingUser] = useState(false)
  const [loadingPokemon, setLoadingPokemon] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Capture card DOM to export as PNG
  const cardRef = useRef<HTMLDivElement>(null)

  const activeType: PokemonTypeName | null = useMemo(() => {
    if (!pokemon) return null
    // Prefer the primary type (slot 1)
    const primary = pokemon.types.sort((a, b) => a.slot - b.slot)[0]?.type.name
    return primary ?? null
  }, [pokemon])

  const cardThemeClasses = useMemo(() => {
    if (!activeType) {
      // Default neutral theme before Pokémon is generated
      return "bg-gradient-to-br from-slate-100 to-slate-200"
    }
    const theme = TYPE_THEME[activeType]
    return cn("bg-gradient-to-br", theme.from, theme.to)
  }, [activeType])

  const statBgClass = useMemo(() => {
    if (!activeType) return "bg-slate-700"
    const t = TYPE_THEME[activeType]
    return cn("bg-gradient-to-br text-white", t.from, t.to)
  }, [activeType])

  const accountAgeDays = useMemo(() => {
    if (!githubUser?.created_at) return null
    const created = new Date(githubUser.created_at as unknown as string).getTime()
    const days = (Date.now() - created) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.floor(days))
  }, [githubUser])

  async function fetchGithubUser(u: string) {
    setLoadingUser(true)
    setError(null)
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`)
      if (!res.ok) throw new Error("GitHub user not found")
      const data = (await res.json()) as GithubUser
      setGithubUser(data as GithubUser)
      try {
        if (data.avatar_url) {
          const durl = await toDataUrl(data.avatar_url)
          setAvatarSrc(durl)
        } else {
          setAvatarSrc(null)
        }
      } catch {
        setAvatarSrc(data.avatar_url || null)
      }
    } catch (e: any) {
      setGithubUser(null)
      setAvatarSrc(null)
      setError(e?.message ?? "Failed to load GitHub user")
    } finally {
      setLoadingUser(false)
    }
  }

  async function fetchPokemonById(id: number) {
    setLoadingPokemon(true)
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (!res.ok) throw new Error("Failed to load Pokémon")
      const data = (await res.json()) as PokemonData
      setPokemon(data)
      try {
        const sprite = data.sprites.front_default
        if (sprite) {
          const durl = await toDataUrl(sprite)
          setSpriteSrc(durl)
        } else {
          setSpriteSrc(null)
        }
      } catch {
        setSpriteSrc(data.sprites.front_default || null)
      }
    } catch (e: any) {
      setPokemon(null)
      setSpriteSrc(null)
      setError(e?.message ?? "Failed to load Pokémon")
    } finally {
      setLoadingPokemon(false)
    }
  }

  async function fetchCommitCount(u: string) {
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}/events/public`)
      if (!res.ok) throw new Error("Failed to load events")
      const events = (await res.json()) as any[]
      const commits = events.reduce((sum, ev) => {
        if (ev?.type === "PushEvent") {
          return sum + (ev?.payload?.commits?.length ?? 0)
        }
        return sum
      }, 0)
      setCommitCount(commits)
    } catch {
      setCommitCount(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const u = username.trim()
    if (!u) return

    setSubmitted(true)

    // reset relevant state
    setPokemon(null)
    setError(null)
    setAvatarSrc(null)
    setSpriteSrc(null)
    setCommitCount(null)

    await Promise.all([fetchGithubUser(u), fetchPokemonById(usernameToGen1Id(u)), fetchCommitCount(u)])
  }

  async function downloadCard() {
    if (!cardRef.current) return
    const dataUrl = await toPng(cardRef.current, { cacheBust: true })
    const link = document.createElement("a")
    link.download = `${githubUser?.login || username || "github"}-pokemon-card.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Default state: show only the input form
  if (!submitted) {
    return (
      <main className="min-h-svh flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4" aria-label="GitHub username form">
          <h1 className="text-2xl font-semibold text-center text-pretty">GitHub Pokémon Card</h1>
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter GitHub username"
              aria-label="GitHub username"
            />
            <Button type="submit" className="shrink-0">
              Create
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Enter a GitHub username to generate a themed trainer card.
          </p>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <div className={cn("w-full max-w-3xl", "transition-colors")}>
        <div ref={cardRef} className="rounded-2xl">
          <Card className={cn("rounded-2xl shadow-xl border-0 text-foreground", cardThemeClasses)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-balance text-white drop-shadow">GitHub Pokémon Card</CardTitle>
            </CardHeader>

            <CardContent className="bg-white/85 backdrop-blur rounded-xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Avatar/username + Partner Pokémon */}
                <div className="space-y-6">
                  {/* Header: GitHub avatar + username */}
                  <section className="flex items-center gap-4">
                    {loadingUser ? (
                      <div className="h-16 w-16 rounded-full bg-slate-200 animate-pulse" aria-hidden />
                    ) : githubUser ? (
                      <img
                        src={avatarSrc || githubUser.avatar_url || "/placeholder.svg"}
                        alt={`${githubUser.login} avatar`}
                        className="h-16 w-16 rounded-full ring-2 ring-slate-200"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-slate-200" aria-hidden />
                    )}

                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Trainer</p>
                      <h2 className="text-xl font-semibold">
                        {loadingUser ? "Loading..." : (githubUser?.login ?? "Unknown")}
                      </h2>
                    </div>
                  </section>

                  {/* Partner Pokémon */}
                  <section>
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-medium">Partner Pokémon</h3>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="md:col-span-1 flex items-center justify-center">
                        {pokemon?.sprites.front_default ? (
                          <img
                            src={spriteSrc || pokemon.sprites.front_default || "/placeholder.svg"}
                            alt={`${capitalize(pokemon.name)} sprite`}
                            className="h-28 w-28 image-render-pixel"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="h-28 w-28 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            {loadingPokemon ? "..." : "No Pokémon"}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="text-xl font-semibold">{pokemon ? capitalize(pokemon.name) : "—"}</p>
                          <p className="text-sm text-muted-foreground mt-4">Type(s)</p>
                          <div className="flex flex-wrap gap-2">
                            {pokemon?.types?.length ? (
                              pokemon.types
                                .sort((a, b) => a.slot - b.slot)
                                .map((t) => (
                                  <span
                                    key={t.type.name}
                                    className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium text-white",
                                      TYPE_THEME[t.type.name]?.from ?? "from-slate-400",
                                      TYPE_THEME[t.type.name]?.to ?? "to-slate-500",
                                      "bg-gradient-to-r",
                                    )}
                                  >
                                    {capitalize(t.type.name)}
                                  </span>
                                ))
                            ) : (
                              <span className="text-sm">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                  </section>
                </div>

                {/* Right column: Stats */}
                <div className="space-y-4">
                  <section aria-label="Stats">
                    <h3 className="text-lg font-medium">Stats</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className={cn("rounded-lg p-3", statBgClass)}>
                        <p className="text-xs opacity-90">HP</p>
                        <p className="text-lg font-semibold">{accountAgeDays != null ? accountAgeDays : "—"}</p>
                      </div>
                      <div className={cn("rounded-lg p-3", statBgClass)}>
                        <p className="text-xs opacity-90">Attack</p>
                        <p className="text-lg font-semibold">{commitCount != null ? commitCount : "—"}</p>
                      </div>
                      <div className={cn("rounded-lg p-3", statBgClass)}>
                        <p className="text-xs opacity-90">Defense</p>
                        <p className="text-lg font-semibold">{githubUser?.public_repos ?? "—"}</p>
                      </div>
                      <div className={cn("rounded-lg p-3", statBgClass)}>
                        <p className="text-xs opacity-90">Charm</p>
                        <p className="text-lg font-semibold">{githubUser?.followers ?? "—"}</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions below the card */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button onClick={downloadCard}>Download Card</Button>
          <Button variant="secondary" onClick={() => setSubmitted(false)}>
            Change User
          </Button>
        </div>
      </div>
    </main>
  )
}
