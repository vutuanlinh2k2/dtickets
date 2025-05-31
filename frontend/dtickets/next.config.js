const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["images.unsplash.com", "blob.v0.dev"], // Keep existing domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "blob.v0.dev",
      },
      {
        // Added for placeholder.svg
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
    unoptimized: true, // Consider setting to false for production if deploying to Vercel
  },
}

module.exports = nextConfig
