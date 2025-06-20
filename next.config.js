/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable strict mode for better React development
  reactStrictMode: true,
  
  // Add webpack configuration to handle chunk loading better
  webpack: (config, { isServer }) => {
    // Optimize chunk splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      }
    }
    
    return config
  },
}

module.exports = nextConfig