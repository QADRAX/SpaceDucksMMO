/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    // When using Next.js Proxy, the request body is buffered so it can be read
    // multiple times (e.g. in proxy + in the underlying route handler). The
    // default is 10MB; increase it to avoid truncation warnings.
    proxyClientMaxBodySize: '500mb',
  },
}

module.exports = nextConfig
