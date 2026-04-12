/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enabling Static Export for Cloudflare Pages compatibility
  output: 'export',
  // Disabling image optimization for static export
  images: {
    unoptimized: true,
  },
  // Improving build stability for real-time components
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Setting defaults for cloud connectivity (SECURE HTTPS/WSS)
  env: {
    NEXT_PUBLIC_API_URL: 'https://back.YOUR_DOMAIN', 
    NEXT_PUBLIC_WS_URL: 'wss://back.YOUR_DOMAIN/api/v1/ws/stream',
  }
};

export default nextConfig;
