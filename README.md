# learnalgorithms.dev

> **From intuition to proof.** Structured algorithm sheets, theoretical foundations, and interactive visualizations.

Live site: [https://learnalgorithms.dev](https://learnalgorithms.dev)

---

## About

**learnalgorithms.dev** is an open educational resource for learning data structures and algorithms from first principles. It combines rigorous theoretical content with interactive React components and visual demonstrations — going beyond rote memorization to build deep understanding.

The site is organized into two parallel tracks:

| Track | Path | Description |
|---|---|---|
| **Concepts** | `/concepts` | Theory, paradigms, and complexity analysis |
| **Algorithms** | `/algorithms` | Concrete problems with interactive visualizations |

---

## Content Structure

### Concepts

```
01 — Foundations
     ├── Algorithmic Thinking
     ├── Case Study: Pairwise Problem
     ├── Complexity Analysis
     ├── Asymptotic Notation
     └── Searching Case Studies

02 — Fundamental Problem Domains
     └── Sorting

03 — Algorithm Design Paradigms
     ├── Brute Force
     ├── Divide and Conquer
     ├── Greedy Algorithms
     └── Dynamic Programming

04 — State-Space Search & Optimization
     ├── Backtracking
     └── Branch and Bound

05 — Advanced Execution Models
     └── Parallel Algorithms
```

Also included: [Glossary](/concepts/glossary) · [Learning Roadmap](/concepts/roadmap)

### Algorithms

```
06 — Dynamic Programming
     └── Coin Change

07 — Backtracking
```

---

## Tech Stack

- **[Docusaurus 3](https://docusaurus.io/)** — static site framework (MDX, React)
- **[KaTeX](https://katex.org/)** — math rendering via `remark-math` + `rehype-katex`
- **React 19** — interactive algorithm visualizers
- **Custom plugins**
  - `remark-autolink-concepts` — auto-links concept terms across pages
  - `docusaurus-plugin-site-data` — aggregates site-wide metadata at build time

---

## Getting Started

**Prerequisites:** Node.js ≥ 18, npm or yarn.

```bash
# Install dependencies
npm install

# Start local dev server (http://localhost:3000)
npm start

# Production build
npm run build

# Preview the production build locally
npm run serve

# Clear Docusaurus cache
npm run clear
```

---

## Deployment

The site deploys automatically to GitHub Pages via CI on every push to `main`.

To deploy manually:

```bash
GIT_USER=vicegd npm run deploy
```

This builds the site and pushes the output to the `gh-pages` branch, which is served at [https://learnalgorithms.dev](https://learnalgorithms.dev).

---

## Project Structure

```
├── concepts/          # MDX content — theory and paradigms
├── algorithms/        # MDX content — concrete algorithm problems
├── src/
│   ├── components/    # React components (visualizers, indexes, roadmap)
│   ├── css/           # Global styles
│   ├── pages/         # Standalone pages (home, stats, glossary)
│   └── plugins/       # Custom Docusaurus/remark plugins
├── static/            # Static assets (images, algorithm data)
├── docusaurus.config.js
├── sidebars.js        # Concepts sidebar
└── sidebarsAlgorithms.js
```

---

## 👨‍💼 Author

[Vicente García Díaz](http://www.vicentegarciadiaz.com)  
School of Computer Science    
University of Oviedo

---

## 📜 License

Copyright (c) 2026 Vicente García Díaz — All Rights Reserved.  
See [LICENSE](LICENSE) file for details.
