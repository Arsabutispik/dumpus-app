/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  eslint: {
    dirs: ["src"],
  },
  images: {
    unoptimized: true,
  },
};

export default config;
