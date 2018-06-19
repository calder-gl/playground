module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    client: './src/frontend/client.ts',
  },
  output: {
    path: __dirname + '/dist/public',
    filename: 'js/[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  }
};
