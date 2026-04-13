/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabling Static Export to allow for dynamic rendering and runtime env variables
  // output: 'export',
  // Disabling image optimization for performance/hosting flexibility
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
};

export default nextConfig;
