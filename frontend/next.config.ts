import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@watchamoo/backend"],
  serverExternalPackages: ["nodemailer", "resend"],
};

export default nextConfig;
