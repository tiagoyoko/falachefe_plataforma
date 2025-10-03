import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduzir logs em desenvolvimento
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Configuração webpack para resolver problemas de módulos server-side no cliente
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        os: false,
        path: false,
        child_process: false,
        cluster: false,
        dgram: false,
        dns: false,
        http: false,
        https: false,
        http2: false,
        querystring: false,
        readline: false,
        repl: false,
        string_decoder: false,
        timers: false,
        tty: false,
        url: false,
        vm: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;
