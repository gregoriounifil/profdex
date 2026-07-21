import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Diz ao Vue quais tags NÃO são componentes Vue, para não tentar
          // resolvê-las e não emitir warnings no console:
          //  - `model-viewer`: web-component nativo da lib de AR
          //  - `Tres*`: tags do TresJS resolvidas pelo renderer próprio dele
          //    (o `<TresCanvas>` em si continua sendo um componente Vue real)
          isCustomElement: (tag) =>
            tag === 'model-viewer' || (tag.startsWith('Tres') && tag !== 'TresCanvas'),
        },
      },
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
