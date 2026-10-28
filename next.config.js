/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double-mounting WebRTC streams during development
  images: {
    domains: ["images.unsplash.com", "avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },
  // Allow mobile devices on LAN to access dev resources without cross-origin warnings
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "192.168.29.232",
    "192.168.29.232:3000"
  ],
};

module.exports = nextConfig;
