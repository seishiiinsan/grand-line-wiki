/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // Autorise le rendu d'images externes sans l'optimiseur (utile pour des sources d'API diverses)
    unoptimized: true,
  },
};

export default nextConfig;
