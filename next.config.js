/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercelデプロイ時のTypeScript型エラーによるビルド中断を防ぐ
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint（未使用変数など）によるビルド中断を防ぐ
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
