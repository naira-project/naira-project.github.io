import { withMermaid } from "vitepress-plugin-mermaid";
import { fileURLToPath, URL } from 'node:url'

// Base path is required because GitHub Pages serves multiple doc versions from subdirectories:
//   - https://naira.github.io/main/          (main branch docs)
//   - https://naira.github.io/release-0.1/   (release branch docs)
//   - https://naira.github.io/pr-preview/pr-123/  (PR previews)
//
// VitePress needs to know this base path at build time so all asset URLs (JS, CSS, images)
// and internal links are prefixed correctly. Without it, a page at /main/overview/ would
// try to load assets from / instead of /main/, causing 404 errors.
//
// The GitHub Actions workflow sets these env vars before running `npm run build`:
//   - DOCS_VERSION: Set for version branches (main, release-*)
//   - PAGES_BASE: Set for PR preview builds
//
// Priority: DOCS_VERSION > PAGES_BASE > "/" (local dev fallback)
const base = 'DOCS_VERSION' in process.env && process.env.DOCS_VERSION != ''
  ? '/' + process.env.DOCS_VERSION + '/'
  : ('PAGES_BASE' in process.env && process.env.PAGES_BASE != ''
    ? '/' + process.env.PAGES_BASE + '/'
    : '/');

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Naira",
  base,

  description: "Naira - The home directory for any AI Platform Engineer",

  vite: {
    resolve: {
      alias: [
        {
          find: /^.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(
              new URL('theme/components/VPFooter.vue', import.meta.url)
          )
        },
        {
          find: /^.*\/VPFeature\.vue$/,
          replacement: fileURLToPath(
              new URL('theme/components/VPFeature.vue', import.meta.url)
          )
        },
      ]
    }
  },


  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      //{ text: 'Getting Started', link: '/getting-started' },
     // { text: 'Overview', link: '/overview' },
     // { text: 'Scenarios', link: '/scenarios' },
      { text: 'Get Involved', link: '/get-involved' },
    ],

    outline: [2, 3, 4, 5],

    search: {
      provider: 'local'
    },

    sidebar: {

      '/overview/': [
        {
            text: 'Overview',
            items: [
            { text: 'Index', link: '/overview/' },
            { text: 'Account Model', link: '/overview/account-model' },
            { text: 'Guiding Principles', link: '/overview/principles' },
            { text: 'Control Planes', link: '/overview/control-planes' },
            { text: 'Design Decisions', link: '/overview/design-decision' },
            ]
        }
      ],

    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/naira-project' }
    ]

  },

})