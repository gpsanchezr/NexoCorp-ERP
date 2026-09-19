/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // El linting se corre aparte (npm run lint); no bloquea el build de producción.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
