# Pokemon-Card
# GitHub Pokémon Card

Create a shareable Pokémon-themed card for any GitHub user. The card auto-assigns a Gen‑1 Pokémon based on the username and displays themed stats:
- HP = GitHub account age in days
- Attack = total commits (approx. from public events)
- Defense = number of public repositories
- Charm = number of followers

Below the card you can:
- Download the card as an image
- Change the user to generate a new card

## Project Link

- Live Demo: https://v0-git-hub-pokemon-card.vercel.app/

## Features

- Enter a GitHub username to generate a themed “trainer card”
- Deterministic Gen‑1 Pokémon assignment from the username
- Pokémon type–themed UI
- GitHub-driven stats on the card (HP, Attack, Defense, Charm)
- Download Card button to save as an image
- Change User button to generate a new card

## Tech Stack

- Next.js (App Router)
- Tailwind CSS + shadcn/ui
- PokéAPI (for Pokémon data)
- GitHub REST API (for user profile and activity)
- html-to-image (export card as an image)

## Usage

- Enter a GitHub username (you can paste with or without a leading “@”).![⚡️ Pikachu ⚡️ ~  Pokémon  ~  ✨GiF✨](https://github.com/user-attachments/assets/34ff529a-8b30-440a-a265-0c5454209882)

- The app:
  - Sanitizes the username
  - Fetches the GitHub profile
  - Auto-assigns a Gen‑1 Pokémon
  - Computes stats and renders the themed card
- Click “Download Card” to save it as an image.
- Click “Change User” to generate another card.

## Accessibility & Design Notes

- Layout uses semantic HTML and responsive flex/grid with Tailwind.
- Contrast is tuned to keep copy legible against themed backgrounds.
- Stats are placed on the right on desktop for visual balance; they stack on mobile.

## Acknowledgements

- [PokéAPI](https://pokeapi.co/) for Pokémon data
- [GitHub REST API](https://docs.github.com/en/rest) for profile/activity
- [html-to-image](https://github.com/bubkoo/html-to-image) for exporting the card
- [shadcn/ui](https://ui.shadcn.com/) for UI primitives

## License

This project is licensed under the Apache2.0.

