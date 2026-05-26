// ─────────────────────────────────────────────────────────────────────────────
// NEXT.JS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
// 📘 next.config.mjs is the main configuration file for Next.js.
// Here we:
//  - Configure which external image domains are allowed (for profile pics)
//  - Set environment variables accessible in the browser
//  - Configure API URL rewrites (optional)
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },  // profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

export default nextConfig;
