import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const username = params.username
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public`
  const headers: HeadersInit = {
    "User-Agent": "v0-github-pokemon-card",
    Accept: "application/vnd.github+json",
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const res = await fetch(url, { headers, cache: "no-store" })
  const text = await res.text()

  if (res.status === 403) {
    try {
      const body = JSON.parse(text)
      const msg = String(body?.message || "").toLowerCase()
      if (msg.includes("rate limit")) {
        return NextResponse.json(
          { error: "rate_limited", message: body?.message || "Rate limit exceeded" },
          { status: 429 },
        )
      }
    } catch {
      // fall through
    }
  }

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
  })
}
