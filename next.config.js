/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "@libsql/isomorphic-ws",
    "@libsql/isomorphic-fetch",
    "libsql",
  ],
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
