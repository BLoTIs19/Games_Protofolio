/*
  PROJECTS
  --------
  This array is the entire "database" for the site. There's no server and
  no upload limit — to add a game, copy one object below, change the
  values, and add it to the array. The grid on the page re-renders itself
  from whatever is in this array, so it scales to any number of entries.

  Fields:
    id          - unique short string, no spaces (used internally)
    title       - project name
    year        - string or number, shown in the detail view
    engine      - engine/tools used, e.g. "Godot", "Unity", "PICO-8"
    tagline     - one sentence, shown on the card
    description - longer paragraph, shown in the detail modal
    tags        - array of strings, used for the filter chips
    image       - cover image path or URL (see assets/README in the repo)
    gallery     - array of extra image paths/URLs (optional, can be empty [])
    playUrl     - link to a playable build/demo (optional, use "" if none)
    codeUrl     - link to the source repo (optional, use "" if none)
*/

const PROJECTS = [
  {
    id: "lantern-keep",
    title: "Lantern Keep",
    year: "2026",
    engine: "Godot 4",
    tagline: "A cozy roguelike about tending a dying lighthouse through one long storm.",
    description: "A single-sitting roguelike built solo over a three-month game jam stretch. You patch the lighthouse, ration oil, and decide which ships to guide in before the storm gets worse. Focused on a tight risk/reward loop and hand-painted pixel lighting.",
    tags: ["roguelike", "solo dev", "pixel art"],
    image: "assets/placeholder-1.svg",
    gallery: ["assets/placeholder-1.svg"],
    playUrl: "https://itch.io",
    codeUrl: "https://github.com"
  },
  {
    id: "signal-drift",
    title: "Signal Drift",
    year: "2025",
    engine: "Unity",
    tagline: "A two-player co-op puzzle game about repairing a satellite from opposite ends.",
    description: "Built with a team of three for a university capstone. Each player sees half of the satellite's wiring diagram and has to talk the other through the fix — voice chat required, no in-game hints. Shipped with 24 hand-built puzzle chambers.",
    tags: ["co-op", "puzzle", "team project"],
    image: "assets/placeholder-2.svg",
    gallery: ["assets/placeholder-2.svg"],
    playUrl: "https://itch.io",
    codeUrl: "https://github.com"
  },
  {
    id: "rustbelt-runner",
    title: "Rustbelt Runner",
    year: "2024",
    engine: "PICO-8",
    tagline: "A one-button endless runner made in a weekend for a fantasy-console jam.",
    description: "A small, finished thing made to prove a small, finished thing could get made. One button, one track, a scoreboard, and a soundtrack written in the PICO-8 tracker.",
    tags: ["arcade", "jam game", "solo dev"],
    image: "assets/placeholder-3.svg",
    gallery: [],
    playUrl: "https://itch.io",
    codeUrl: ""
  }
];
