import path from 'path'
import packageConfig from './package'

const { name: libraryName, filename: libraryFilename } = packageConfig.library
const outputName = process.env.NODE_ENV === 'production'
  ? `${libraryFilename}.min.js`
  : `${libraryFilename}.js`

export default {
  entry: path.join(__dirname, '/src/index.js'),
  devtool: 'cheap-module-source-map',
  output: {
    path: path.join(__dirname, '/lib'),
    filename: outputName,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        include: path.resolve('src'),
        exclude: /(node_modules|bower_components)/
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./src')],
    extensions: ['.json', '.js']
  }
}
