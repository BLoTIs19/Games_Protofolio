# Game Developer Portfolio

A static, GitHub Pages–ready portfolio for a game developer / Unreal Engine developer, with a public
case-study-style project showcase and a self-serve admin dashboard for managing projects.

No build step, no framework, no server required — plain HTML, CSS, and vanilla JavaScript.

## Structure

```
index.html              Public homepage (hero, about, skills, projects, contact)
project.html            Project case-study page (?slug=your-project)
admin/login.html        Admin sign-in
admin/dashboard.html    Admin dashboard (add/edit/delete/reorder/feature projects)
css/tokens.css          Shared design tokens (colors, type, spacing)
css/main.css            Public site styles
css/admin.css           Admin-only styles
js/config.js            <-- Edit this to customize your name, bio, skills, links
js/store.js             Data layer (project schema, localStorage, seed/demo data)
js/auth.js              Demo admin auth (see Security section below)
js/background.js        Subtle animated canvas background
js/public.js            Renders the public homepage
js/project-detail.js    Renders the project case-study page
js/admin.js             Admin dashboard logic
```

## Quick customization

Open `js/config.js` and edit:

- `name`, `title`, `tagline` — hero content
- `about.bio`, `about.focus` — About section
- `skills` — the skills/technologies grid (grouped, freely editable)
- `social` — email, GitHub, LinkedIn, itch.io, ArtStation (leave blank to hide)
- `accentColor` — optional hex override for the accent color
- `admin.username` / `admin.passwordHash` — see **Security** below before deploying

Everything else (projects) is managed from `/admin` once deployed, or by editing the
`DEMO_PROJECTS` array in `js/store.js` directly.

## Managing projects

Visit `/admin/login.html`. Demo credentials are `admin` / `changeme123` — **change these**
(see Security). From the dashboard you can:

- Add, edit, and delete projects (title, description, engine, languages, tools, platforms,
  role, team size, dates, tags, images, videos, GIFs, and links)
- Mark projects **Featured** so they appear in the homepage's "Featured work" section
- Set **visibility** (Published / Draft / Hidden) — only Published projects appear publicly
- Sort projects by date automatically, or turn on **manual order** and drag rows to reorder

Project data is stored in the browser's `localStorage`, scoped to whichever device/browser
you're using when you add content. See **Data & persistence** below for what that means in
practice.

## Data & persistence — read this before adding real projects

This is a **frontend-only prototype**. Project data lives in `localStorage` in the browser
you're using — it is *not* saved to a file, is *not* shared across devices, and is *not*
visible to visitors of your live site unless you also change it in the browser they're using
(which you can't). In practice, this means:

- Anything you add in the admin dashboard only reflects on **your** current browser.
- Visitors to your published GitHub Pages site will see whatever `DEMO_PROJECTS` (in
  `js/store.js`) contains, since they've never touched your local `localStorage`.

**For a real deployment**, once you're happy with your projects, either:

1. **Bake your data in (simplest):** use the admin dashboard locally to build out your
   projects, then open the browser console and run `copy(JSON.stringify(Store.getAll()))` to
   copy the current project list, and paste it in to replace `DEMO_PROJECTS` in `js/store.js`.
   Commit that file. Now every visitor sees your real projects, and the admin dashboard still
   works locally for future edits (repeat this step after each editing session).
2. **Move to a real backend:** replace the internals of `js/store.js` with calls to a service
   such as Supabase, Firebase, or a small custom API. Because every other file only calls
   functions on `Store` (`getAll`, `save`, `remove`, `reorder`, etc.), nothing else needs to
   change.

## Security — read this before deploying publicly

The admin login in `js/auth.js` is **demo-grade, not real security**:

- It checks a password against a SHA-256 hash stored in `js/config.js`, entirely in the
  browser. Anyone can view that hash in your page source.
- There is no server verifying anything — this only gates the *UI*, not the underlying data.
  Since project data lives in `localStorage` (see above), there's nothing sensitive to
  actually protect in this prototype: a visitor could not access *your* admin session or
  edit *your* live data through it.
- Treat `/admin` as a content-editing convenience for yourself, on your own machine — not as
  an access-control system.

**Before changing the default password:**

1. Open your browser's console on any page of the site (or use Node) and run:
   ```js
   async function sha256(text) {
     const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
     return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
   }
   await sha256("your-new-password");
   ```
2. Copy the resulting hex string into `admin.passwordHash` in `js/config.js`.
3. Update `admin.username` too, if you like.

**If you ever need real access control** (multiple editors, a public write API, sensitive
data), replace `Auth.attemptLogin` with a call to:

- A small serverless function (Cloudflare Worker, AWS Lambda, Vercel/Netlify function) that
  checks credentials against environment variables and issues a signed session (e.g. a JWT in
  an httpOnly cookie), or
- A managed auth provider (Auth0, Supabase Auth, Firebase Auth, Clerk).

Everything else in `admin.js` only calls `Auth.isAuthenticated()` and `Auth.logout()`, so the
rest of the dashboard doesn't need to change.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to the `main` branch
   (this folder should be the repo root — `index.html` at the top level).
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In the repository on GitHub: **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`,
   folder `/ (root)`. Save.
4. GitHub will publish the site at `https://<your-username>.github.io/<your-repo>/` within a
   minute or two (a **User/Organization site** repo named `<your-username>.github.io` will
   instead publish at `https://<your-username>.github.io/`).
5. Because all links in this project are relative, it works the same whether it's served from
   a domain root or a subpath — no path rewriting needed.

Before your first deploy, remember to replace the `DEMO_PROJECTS` in `js/store.js` with your
real projects (see **Data & persistence** above) and update `js/config.js` with your details.

## Accessibility & performance notes

- Respects `prefers-reduced-motion`: the background animation, scroll reveals, and smooth
  scrolling all fall back to static/instant behavior.
- Semantic landmarks (`header`, `main`, `footer`), labeled form fields, visible focus states,
  and a skip-to-content link are included throughout.
- Images use `loading="lazy"`; the background animation pauses when the tab isn't visible.
- Filtering/searching projects does not reload the page.

## Notes on the demo content

The three sample projects (Ashfall Protocol, Hollow Orbit, Field Editor Toolkit) are
fictional placeholders meant to demonstrate the layout — replace or delete them from the
admin dashboard (or `DEMO_PROJECTS` in `js/store.js`) before publishing.
