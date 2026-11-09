/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@qrserveup/types", "@qrserveup/auth", "@qrserveup/db"],
};

export default nextConfig;
