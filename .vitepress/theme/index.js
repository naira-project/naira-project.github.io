import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import PostList from './components/PostList.vue'
import Pagination from './components/Pagination.vue'
import SchemaExplorer from './components/schema-explorer/SchemaExplorer.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('PostList', PostList)
    app.component('Pagination', Pagination)
    app.component('SchemaExplorer', SchemaExplorer)
  },
}
