import type { NextConfig } from "next";

const ONE_YEAR = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  // Next serves /public files with max-age=0 by default, which means the
  // browser re-validates every image/video each visit. Cache them hard.
  // (If you replace a file, rename it, e.g. rent.jpg -> rent.v2.jpg.)
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        source: "/avatars/:path*",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        source: "/sounds/:path*",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
      {
        source: "/:file(.*\\.(?:jpg|jpeg|png|webp|svg))",
        headers: [{ key: "Cache-Control", value: ONE_YEAR }],
      },
    ];
  },
};

export default nextConfig;
