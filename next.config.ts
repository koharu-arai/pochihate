import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // start-iphone.bat は .next-iphone に作るので、start.bat(開発用)と同時に動かしてもぶつからない
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // ESLint は未導入なので、ビルド時のチェックは TypeScript の型チェックだけにしています
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
