const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = function override(config, env) {
  // Load our custom webpack optimizations
  const optimizations = require('./webpack.optimization');
  
  if (isProduction) {
    // Apply optimizations to webpack config
    config.optimization = {
      ...config.optimization,
      ...optimizations.optimization,
    };
    
    // Add optimization plugins
    config.plugins = [
      ...config.plugins,
      ...(optimizations.plugins || []),
    ];
    
    // Apply output optimizations
    if (optimizations.output) {
      config.output = {
        ...config.output,
        ...optimizations.output,
      };
    }
    
    // Only add bundle analyzer if explicitly requested
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
        })
      );
    }
    
    // Add module federation if needed
    // This allows loading components from other apps
    /*
    config.plugins.push(
      new ModuleFederationPlugin({
        name: 'car_auto_care',
        filename: 'remoteEntry.js',
        exposes: {
          // Export components that can be consumed by other apps
          './Button': './src/components/Button',
        },
        shared: {
          // Share dependencies to avoid duplication
          react: { 
            singleton: true, 
            requiredVersion: dependencies.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: dependencies['react-dom'],
          },
        },
      })
    );
    */
  }
  
  // Enable source maps in development for better debugging
  if (!isProduction) {
    config.devtool = 'eval-source-map';
  }
  
  // Add path aliases for cleaner imports
  config.resolve.alias = {
    ...config.resolve.alias,
    'components': path.resolve(__dirname, 'src/components'),
    'hooks': path.resolve(__dirname, 'src/hooks'),
    'utils': path.resolve(__dirname, 'src/utils'),
    'Services': path.resolve(__dirname, 'src/Services'),
    'types': path.resolve(__dirname, 'src/types'),
  };

  return config;
}; 