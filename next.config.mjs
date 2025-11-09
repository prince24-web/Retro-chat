/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Ignore 'canvas' module from pdfjs-dist
    config.externals.push({ canvas: "commonjs canvas" });
    return config;
  },
};

export default nextConfig;
