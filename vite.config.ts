import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({base:'./',plugins:[react()],resolve:{alias:{'@':path.resolve(import.meta.dirname,'.')}},server:{watch:{usePolling:true}},build:{target:['es2017','chrome61']}});
