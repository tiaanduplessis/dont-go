import webpack from 'webpack';
import path from 'path';

// Package.json
import packageConfig from './package';
const { name: libraryName, filename: libraryFilename, entry: libraryEntry } = packageConfig.library;

// Environment variable
const env = process.env.NODE_ENV || 'production';
const PROD = env === 'production';

// Configuration
const outputPath = path.resolve( __dirname, 'lib' );
const outputName = PROD ? `${libraryFilename}.min.js` : `${libraryFilename}.js`;

export default {
  entry: libraryEntry,
  devtool: 'source-map',
  output: {
    path: outputPath,
    library: libraryName,
    filename: outputName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  resolve: {
    root: path.resolve( 'src' ),
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel?cacheDirectory',
        include: path.resolve( 'src' )
      },
      {
        test: /\.js$/,
        loader: 'eslint',
        include: path.resolve( 'src' )
      }
    ]
  },
  plugins: PROD ? [
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false }
    })
  ] : []
};
