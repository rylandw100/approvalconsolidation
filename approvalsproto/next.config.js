/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce hot reloading frequency to prevent 429 errors
  webpackDevMiddleware: {
    poll: false,
  },
  // Disable Turbopack if it's causing issues (uncomment if needed)
  // experimental: {
  //   turbo: false,
  // },
}

module.exports = nextConfig


