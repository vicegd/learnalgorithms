# learnalgorithms.dev

> **From intuition to proof.** Lessons on the design and analysis of algorithms, with diagrams, step-by-step traces, proofs and exercises.

Live site: [https://learnalgorithms.dev](https://learnalgorithms.dev)

---

## About

**learnalgorithms.dev** is the companion website of the *Algorithmics* course (Software Engineering degree, University of Oviedo). It explains how algorithms are designed, why they work and how much they cost, from first principles to formal proofs. The website is free for everyone, with no registration and no ads.

Each chapter contains:

- **Lessons** with explanations, diagrams and step-by-step traces.
- **Practice boxes** with short activities to check understanding.
- **Proofs** of the results used in the lessons.
- A **summary** page to review the chapter, and **exercises** with solutions.
- A header in every lesson with its **reading time** and the lessons to **read first**.
- **References** and, for each classic algorithm, a link to its **original publication**.
- **Code** for every algorithm in the [vicegd/algorithms](https://github.com/vicegd/algorithms) repository.
- **Big-O Cheat Sheet** (`/cheat-sheet`): interactive complexity comparison table with search, paradigm and property filters (*Stable*, *In-place*, *Optimal*), column sorting, and side-by-side comparison.
- **Local study progress**: mark lessons as completed in `localStorage`, reflected with checkmarks in the sidebar and progress bars on the home page.

---

## Content

All lessons live in `concepts/` and are served under `/concepts`.

```
Part I. Foundations
    1. Principles of Algorithmics
Part II. Problem Domains
    2. Sorting
Part III. Design Techniques
    3. Brute Force
    4. Divide and Conquer
    5. Greedy Algorithms
    6. Dynamic Programming
    7. Backtracking
    8. Branch and Bound
Part IV. Execution Models
    9. Parallel Algorithms
Appendices
    A. Mathematical Background
Glossary
```

The `algorithms/` folder (algorithm sheets with interactive visualizers) and `blog/` are kept in the repository but are not published for now: they are switched off with `SHOW_ALGORITHMS` and `blog: false` in `docusaurus.config.js`.

---

## Feedback

Found an error, have a suggestion or a question about a lesson? Use the links at the bottom of every page, or [open an issue](https://github.com/vicegd/learnalgorithms/issues/new/choose). The issue forms fill in the page automatically.

---

## Tech stack

- **[Docusaurus 3](https://docusaurus.io/)** with React 19 and MDX, built with Docusaurus Faster (Rspack).
- **[KaTeX](https://katex.org/)** for mathematics (`remark-math` + `rehype-katex`).
- **SVG diagrams** imported as React components, with light and dark themes driven by CSS variables (`--dg-*`).
- **Custom components** available in every MDX file (`src/theme/MDXComponents.js`):
  `Figure`, `Origin`, `ProofLink`, `RepoCode`, `ToSolution`, `ToStatement`.
- **Custom plugins** (`src/plugins/`):
  - `remark-autolink-concepts` — links concept terms to their lessons.
  - `remark-code-line-numbers` — line numbers in code blocks.
  - `remark-lesson-meta` — reading time and prerequisites under the title of each lesson. Prerequisites are listed in the front matter as permalinks (`prerequisites:`), and a wrong one fails the build.
  - `docusaurus-plugin-local-search` — builds `search-index.json` from the generated pages; the search box (`src/theme/SearchBar`) uses it in the browser, with no external service. Shortcut: Ctrl/Cmd + K or `/`.
  - `docusaurus-plugin-site-data` — site-wide metadata collected at build time.
- **Matomo** (`stats.garcia.at`) and an optional privacy-preserving **telemetry API** (`api/`, served at `api.learnalgorithms.dev` using Python stdlib + SQLite) for anonymous learning analytics and CSV export.
- **GitHub Pages** hosting, deployed by **GitHub Actions** on every push to `main`.

---

## Getting started

**Prerequisites:** Node.js ≥ 20 and npm (plus Python 3.12+ if running API tests).

```bash
npm install      # install dependencies
npm start        # dev server at http://localhost:3000
npm test         # run JavaScript unit tests (node --test)
npm run build    # production build in build/
npm run serve    # preview the production build
npm run clear    # clear the Docusaurus cache

# Backend API tests
python -m unittest discover -s api/tests -v
```

---

## Project structure

```
├── concepts/                    # Lessons (MDX), one folder per chapter
│   ├── 00-index.mdx             # Overview of all parts and chapters
│   ├── glossary.mdx
│   └── NN-chapter-name/
│       ├── NN-lesson.mdx        # Lessons, in order
│       ├── summary.mdx          # Chapter summary (placed before the exercises)
│       ├── NN-exercises.mdx     # End-of-chapter exercises
│       ├── proofs.mdx           # Proofs referenced from the lessons
│       ├── references.mdx       # Bibliography
│       └── img/                 # SVG diagrams of the chapter
├── algorithms/                  # Algorithm sheets (not published yet)
├── api/                         # Privacy-preserving backend API (Python stdlib + SQLite)
├── blog/                        # Blog (not published yet)
├── src/
│   ├── components/              # React components (Figure, Origin, ProofLink, RepoCode…)
│   ├── css/custom.css           # Global styles, diagram colours, practice boxes
│   ├── pages/                   # Home page, Big-O Cheat Sheet (/cheat-sheet), Site Stats (/stats)
│   ├── plugins/                 # Custom remark and Docusaurus plugins
│   ├── theme/                   # Swizzled/wrapped theme components (progress, feedback, sidebar, TOC)
│   ├── utils/                   # Shared client utilities (studyProgress.js)
│   ├── matomo.js                # Matomo SPA pageview tracking
│   └── telemetry.js             # Anonymous telemetry client (page views, reading time, scroll, events)
├── tests/                       # JavaScript unit tests (node --test)
├── static/                      # Static files (images, CNAME)
├── .github/
│   ├── ISSUE_TEMPLATE/          # Issue forms: error, suggestion, question
│   └── workflows/               # Build and deploy to GitHub Pages
├── docusaurus.config.js
└── sidebars.js                  # Parts and chapters of the sidebar
```

### Adding a chapter

1. Create `concepts/NN-chapter-name/` with its lessons, summary, exercises, proofs and references.
2. Add one `chapter(...)` line to the right part in `sidebars.js`.
3. Add its card to `CHAPTERS` in `src/pages/index.js`, and its icon and accent in `src/components/Icon.jsx`.

Number prefixes in folder and file names set the order and are removed from the URLs.

---

## Deployment

Every push to `main` builds the site and publishes it to the `gh-pages` branch, served at [https://learnalgorithms.dev](https://learnalgorithms.dev). It takes about two minutes.

---

## Author

[Vicente García Díaz](https://www.vicentegarciadiaz.com)
School of Computer Science, University of Oviedo

---

## License

Copyright (c) 2026 Vicente García Díaz — All Rights Reserved.
See the [LICENSE](LICENSE) file for details.
