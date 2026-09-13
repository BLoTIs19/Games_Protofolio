# SHELF/64 — game portfolio template

A static, framework-free portfolio for showing off game projects. No backend,
no build step — just HTML, CSS and JS, so it drops straight into GitHub Pages.

## Files

- `index.html` — page structure
- `style.css` — all styling
- `projects.js` — **your project data**. Add unlimited entries here.
- `script.js` — renders the shelf, filters, and modals from `projects.js`
- `assets/` — put your cover images and screenshots here

## Adding a project

Open `projects.js` and add an object to the `PROJECTS` array — copy an
existing entry as a starting point:

```js
{
  id: "your-game-id",
  title: "Your Game",
  year: "2026",
  engine: "Unity",
  tagline: "One sentence, shown on the card.",
  description: "A longer paragraph, shown when someone opens the project.",
  tags: ["genre", "solo dev"],
  image: "assets/your-game/cover.png",
  gallery: ["assets/your-game/1.png", "assets/your-game/2.png"],
  playUrl: "https://yourname.itch.io/your-game",
  codeUrl: "https://github.com/you/your-game"
}
```

There's no cap on how many objects you add — the grid, the filter chips,
and the boot-text counter on the hero screen all read from this array.

The site also has an **"Add a project"** button in the browser itself. It
won't publish anything on its own (this is a static site, so there's no
server to save to) — but it previews your new project live in your own
browser via local storage, and generates the exact code block above so you
can paste it into `projects.js`.

## Images

Reference images either as a path inside `assets/` (recommended — commit
them to the repo) or as a full URL to an image hosted elsewhere (itch.io,
imgur, your own CDN). Both work identically.

## Publishing to GitHub Pages

See the step-by-step instructions in the chat response, or:

1. Create a new GitHub repository and push these files to it.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch".
4. Pick the `main` branch and the `/ (root)` folder, then **Save**.
5. Wait a minute, then visit `https://<your-username>.github.io/<repo-name>/`.

## Customizing the look

Colors, fonts and spacing all live as CSS variables at the top of
`style.css` (the `:root` block) — change those to reskin the whole site
without touching layout code.
