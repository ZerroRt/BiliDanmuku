import { defineConfig} from 'vite'
import { BiliApiHost } from './src/biliLibs/BILIAPI_CONFIG'

export default defineConfig({
    plugins: [],
    server: {
        host: '0.0.0.0',
        port: 3000,
        proxy: {
            '^/room/v1/.*': {
                target: BiliApiHost,
                changeOrigin: true,
            }
        }
    },
})