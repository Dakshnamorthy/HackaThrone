import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/upload': {
        target: 'https://ocr-api-tau.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upload/, '/upload'),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('upload proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Upload Request:', req.method, req.url);
            console.log('Target URL:', 'https://ocr-api-tau.vercel.app' + req.url.replace('/api/upload', '/upload'));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Upload Response:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api/ocr-result': {
        target: 'https://ocr-api-tau.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ocr-result/, '/aadhaar-ocr'),
        secure: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('ocr proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('OCR Request:', req.method, req.url);
            console.log('Target URL:', 'https://ocr-api-tau.vercel.app' + req.url.replace('/api/ocr-result', '/aadhaar-ocr'));
            // Log content type for POST requests
            if (req.method === 'POST') {
              console.log('Content-Type:', proxyReq.getHeader('content-type'));
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('OCR Response:', proxyRes.statusCode, req.url);
            console.log('Response Content-Type:', proxyRes.headers['content-type']);
          });
        }
      }
    }
  }
})

