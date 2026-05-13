// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

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
  onBrokenMarkdownLinks: 'warn',
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
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Concepts',
          },
          {
            type: 'docSidebar',
            sidebarId: 'algorithmsSidebar',
            docsPluginId: 'algorithms',
            position: 'left',
            label: 'Algorithms',
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
        copyright: `Copyright © ${new Date().getFullYear()} learnalgorithms.dev`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'algorithms',
        path: './algorithms',
        routeBasePath: 'algorithms',
        sidebarPath: './sidebarsAlgorithms.js',
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    ],
  ],
};

export default config;
