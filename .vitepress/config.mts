import { fileURLToPath, URL } from "node:url";
import { withMermaid } from "vitepress-plugin-mermaid";
import { readAllPosts } from "./blog-posts-fs";

function buildBlogSidebar() {
  const posts = readAllPosts();
  const byYear = new Map<string, { text: string; link: string }[]>();
  for (const post of posts) {
    let yearPosts = byYear.get(post.year);
    if (!yearPosts) {
      yearPosts = [];
      byYear.set(post.year, yearPosts);
    }
    yearPosts.push({
      text: post.title,
      link: `/blog/posts/${post.slug}`,
    });
  }
  return [...byYear]
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    .map(([year, items]) => ({
      text: year,
      collapsed: false,
      items,
    }));
}

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "Naira",
  description:
    "The open source internal development platform to enable organizations building AI first platforms",
  head: [["link", { rel: "icon", href: "favicon.ico" }]],
  ignoreDeadLinks: "localhostLinks",
  cleanUrls: true,
  base:
    "DOCS_VERSION" in process.env && process.env.DOCS_VERSION !== ""
      ? `/${process.env.DOCS_VERSION}/`
      : "PAGES_BASE" in process.env && process.env.PAGES_BASE !== ""
        ? `/${process.env.PAGES_BASE}/`
        : "/",

  srcExclude: ["**/README.md", "**/CONTRIBUTING.md"],
  lastUpdated: true,

  vite: {
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: ["fastdom", "fastdom/extensions/fastdom-promised.js"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    resolve: {
      alias: [
        {
          find: /^.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(new URL("theme/components/VPFooter.vue", import.meta.url)),
        },
        {
          find: /^.*\/VPFeature\.vue$/,
          replacement: fileURLToPath(new URL("theme/components/VPFeature.vue", import.meta.url)),
        },
      ],
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Documentation", link: "/documentation/" },
      { text: "Blog", link: "/blog/", activeMatch: "^/blog/" },
    ],

    editLink: {
      pattern: "github.com/naira-project/naira-project.github.io/edit/main/:path",
    },

    logo: {
      src: "/logo.png",
      width: 24,
      height: 24,
    },

    outline: [2, 3, 4, 5],

    search: {
      provider: "local",
    },

    sidebar: {
      "/documentation/": [
        {
          text: "Documentation",
          items: [
            { text: "Introduction", link: "/documentation/" },
            { text: "Concepts", link: "/documentation/concepts" },
            { text: "Catalog Schema", link: "/documentation/catalog-schema" },
            { text: "Tech Radar", link: "/documentation/tech-radar" },
            { text: "Contribute", link: "/documentation/contribute" },
            { text: "Community", link: "/documentation/community" },
          ],
        },
      ],
      "/blog/": buildBlogSidebar(),
    },

    socialLinks: [{ icon: "github", link: "https://github.com/naira-project" }],
  },
});
