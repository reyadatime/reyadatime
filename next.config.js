/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // or 'export' for static sites
  images: {
    domains: ['your-domain.com'], // Add your image domains here
  },
}

module.exports = nextConfig