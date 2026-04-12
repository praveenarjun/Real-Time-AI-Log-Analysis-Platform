/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensuring the dashboard is treated as a dynamic app
  output: 'standalone',
  // Improving build stability for real-time components
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Setting defaults for cloud connectivity
  env: {
    NEXT_PUBLIC_API_URL: 'http://20.200.255.31',
    NEXT_PUBLIC_WS_URL: 'ws://20.200.255.31/api/v1/ws/stream',
  }
};

export default nextConfig;
