/*
  SITE CONFIG
  -----------
  Edit this file to customize the portfolio. Nothing else needs to change
  for basic personalization (name, bio, skills, links, colors).
*/

const SITE_CONFIG = {
  name: "Alex Rowan",
  title: "Gameplay Programmer / Unreal Engine Developer",
  tagline:
    "I build gameplay systems, tools and interactive experiences in Unreal Engine and C++ — from combat and AI to editor tooling.",

  hero: {
    ctaPrimary: { label: "View projects", href: "#projects" },
    ctaSecondary: { label: "GitHub", href: "https://github.com/yourusername" },
    ctaTertiary: { label: "Contact", href: "#contact" },
  },

  about: {
    bio: [
      "I'm a gameplay-focused developer working primarily in Unreal Engine, with a strong C++ foundation and a habit of writing tools that make other developers' lives easier.",
      "I care about systems that stay readable as a project grows — clean gameplay frameworks, sane replication, and editor tooling that saves the team time.",
    ],
    focus: [
      "Gameplay Programming",
      "AI & Behavior Trees",
      "Multiplayer & Replication",
      "Editor Tooling",
    ],
  },

  // Editable skills list. Grouped, but grouping is cosmetic only.
  skills: [
    { group: "Engines", items: ["Unreal Engine 5", "Unity"] },
    { group: "Languages", items: ["C++", "Blueprint", "C#", "Python"] },
    {
      group: "Gameplay",
      items: ["Gameplay Ability System", "AI / Behavior Trees", "Animation Blueprints", "UMG / UI"],
    },
    { group: "Systems", items: ["Multiplayer & Replication", "Save Systems", "Optimization"] },
    { group: "Tools", items: ["Git", "Perforce", "Jenkins", "Jira"] },
  ],

  social: {
    email: "your.email@example.com",
    github: "https://github.com/yourusername",
    linkedin: "https://linkedin.com/in/yourusername",
    itch: "",
    artstation: "",
  },

  // Purely cosmetic accent override. Leave null to use the default theme.
  accentColor: null,

  // Demo-only admin credentials. See README — replace with real backend auth
  // before deploying anywhere the admin login must actually be secure.
  admin: {
    username: "admin",
    // sha-256 hex digest of the password, generated with:
    //   await sha256("your-password")
    // default value below corresponds to "changeme123" — CHANGE THIS.
    passwordHash:
      "494a715f7e9b4071aca61bac42ca858a309524e5864f0920030862a4ae7589be",
  },
};
