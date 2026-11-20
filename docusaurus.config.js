// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {themes as prismThemes} from 'prism-react-renderer';
import remarkAutolinkConcepts from './src/plugins/remark-autolink-concepts.js';
import pluginSiteData from './src/plugins/docusaurus-plugin-site-data.js';
import remarkCodeLineNumbers from './src/plugins/remark-code-line-numbers.js';
import remarkLessonMeta from './src/plugins/remark-lesson-meta.js';
import pluginLocalSearch from './src/plugins/docusaurus-plugin-local-search.js';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Toggle the "Algorithm Sheets" section (navbar, homepage card, /algorithms
// routes, stats and cross-references). Content in ./algorithms is preserved.
const SHOW_ALGORITHMS = false;
const SHOW_NAV_SECTIONS = false;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Learn Algorithms',
  tagline: 'Learn data structures and algorithms interactively',
  favicon: 'img/favicon.ico',

  // Configuración de producción para tu dominio de Hostinger
  url: 'https://learnalgorithms.dev',
  baseUrl: '/',

  // GitHub Pages deployment configuration
  organizationName: 'vicegd', // Your GitHub username
  projectName: 'learnalgorithms', // Repository name
  deploymentBranch: 'gh-pages', // Branch where the compiled site will be published
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  customFields: {
    showAlgorithms: SHOW_ALGORITHMS,
  },
  // ... (deja el resto del archivo hacia abajo tal y como está por ahora)

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: './concepts',
          routeBasePath: 'concepts',
          sidebarPath: './sidebars.js',
          remarkPlugins: [remarkMath, remarkAutolinkConcepts, remarkCodeLineNumbers, remarkLessonMeta],
          rehypePlugins: [rehypeKatex],
        },
        blog: false, // hidden — content preserved in blog/ folder
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
      },
      navbar: {
        title: 'learnalgorithms.dev',
        logo: {
          alt: 'learnalgorithms.dev logo',
          src: 'img/logo.svg',
        },
        items: [
          // The "Concepts" and "Stats" menu entries are hidden for now: the
          // concepts are reached from the home page, and the stats page will
          // return when there is more to show. Set SHOW_NAV_SECTIONS to true
          // to bring them back.
          ...(SHOW_NAV_SECTIONS
            ? [
                {
                  type: 'docSidebar',
                  sidebarId: 'tutorialSidebar',
                  position: 'left',
                  label: 'Concepts',
                },
              ]
            : []),
          ...(SHOW_ALGORITHMS
            ? [
                {
                  type: 'docSidebar',
                  sidebarId: 'algorithmsSidebar',
                  docsPluginId: 'algorithms',
                  position: 'left',
                  label: 'Algorithms',
                },
              ]
            : []),
          ...(SHOW_NAV_SECTIONS
            ? [
                {
                  to: '/stats',
                  position: 'left',
                  label: 'Stats',
                },
              ]
            : []),
          {
            to: '/cheat-sheet',
            label: 'Cheat Sheet',
            position: 'left',
          },
          {
            href: 'https://github.com/vicegd/learnalgorithms',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} learnalgorithms.dev · Created by <a href="https://www.vicentegarciadiaz.com" target="_blank" rel="noopener noreferrer">Vicente García Díaz</a> · <a href="https://github.com/vicegd/learnalgorithms/issues/new/choose" target="_blank" rel="noopener noreferrer">Report an issue</a>`,
      },
      prism: {
        theme: prismThemes.oneLight,
        darkTheme: prismThemes.oneDark,
        additionalLanguages: ['java', 'bash', 'latex'],
        magicComments: [
          {
            className: 'theme-code-block-highlighted-line',
            line: 'highlight-next-line',
            block: {start: 'highlight-start', end: 'highlight-end'},
          },
        ],
      },
    }),

  clientModules: ['./src/matomo.js', './src/telemetry.js'],

  headTags: [
    // Security: Content Security Policy. GitHub Pages cannot send HTTP headers,
    // so the policy goes in a <meta> tag (frame-ancestors and report-uri are
    // not available this way). 'unsafe-inline' is needed by the inline scripts
    // of Docusaurus and Matomo; every external origin is listed explicitly.
    {
      tagName: 'meta',
      attributes: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self'; script-src 'self' 'unsafe-inline' https://stats.garcia.at; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' data: https://cdn.jsdelivr.net; img-src 'self' data: https://stats.garcia.at; connect-src 'self' https://stats.garcia.at https://api.learnalgorithms.dev; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
      },
    },
    {
      tagName: 'meta',
      attributes: {name: 'referrer', content: 'strict-origin-when-cross-origin'},
    },
    {
      tagName: 'script',
      attributes: {},
      innerHTML: `
        var _paq = window._paq = window._paq || [];
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="//stats.garcia.at/";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', '7']);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
        })();
      `,
    },
  ],

  plugins: [
    [pluginSiteData, {includeAlgorithms: SHOW_ALGORITHMS}],
    pluginLocalSearch,
    ...(SHOW_ALGORITHMS
      ? [
          [
            '@docusaurus/plugin-content-docs',
            {
              id: 'algorithms',
              path: './algorithms',
              routeBasePath: 'algorithms',
              sidebarPath: './sidebarsAlgorithms.js',
              remarkPlugins: [remarkMath, remarkAutolinkConcepts, remarkCodeLineNumbers],
              rehypePlugins: [rehypeKatex],
            },
          ],
        ]
      : []),
  ],
};

export default config;
