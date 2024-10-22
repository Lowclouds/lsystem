const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const autoprefixer = require('autoprefixer')
const sveltePreprocess = require('svelte-preprocess');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
  entry: {
    './code/bundle': ['./src/main.js'],
//    home: {import: './pages/index.html', filename: '[name].html'},
  },
  output: {
    path: path.join(__dirname, '/public'),
    //path: path.resolve(__dirname, 'public'),
    filename: '[name].js',
    chunkFilename: '[name].[id].js',
    clean: true,
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte/src/runtime')
    },
    extensions: ['.mjs', '.js', '.svelte' ],
    mainFields: ['svelte', 'browser', 'module', 'main'],
    conditionNames: ['svelte', 'browser']
  },
  module: {
    rules: [
      {
	test: /\.(htm|svelte)$/,
	use: {
	  loader: 'svelte-loader',
	  options: {
	    compilerOptions: {
	      dev: !prod
	    },
	    emitCss: prod,
	    hotReload: !prod,
            noReload: false,
            optimistic: false,
            //preprocess: sveltePreprocess(),
	  }
	},
      },
      {
        test: /\.ls$/,
        type: 'asset/source',
      },
      {
        test: /.*\.m?js$/,
        resolve: {
          fullySpecified: false,
        }
      },
      {
	test: /\.css$/,
	exclude: /svelte\.\d+\.css/,
        use: [
	  MiniCssExtractPlugin.loader,
	  'css-loader',
          'postcss-loader'
	]
      },
      {
	test: /\.css$/,
        include: /svelte\.\d+\.css/,
	use: [
	  MiniCssExtractPlugin.loader,
	   {
              loader: 'css-loader',
              options: {
                 sourceMap: true,
              }
           }
	]
      },
      {
        test: /\.(scss)$/,
        use: [
          {
            // Adds CSS to the DOM by injecting a `<style>` tag
             //loader: 'style-loader'
	    loader: MiniCssExtractPlugin.loader
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer
                ]
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
      }

    ]
  },
  mode,
  devtool: 'source-map',
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    // new HtmlWebpackPlugin({
    //   template: './pages/index.html'
    // }),
    new FileManagerPlugin({
      events: {
        onStart: {
          delete: [ './public' ],
        },
        onEnd: {
          mkdir: ['./public', './public/code', './public/assets/examples'],
          copy: [
            { source: './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
              destination: './public/code/vendor/',
            },
            { source: './node_modules/mathjs/lib/browser/math.js',
              destination: './public/code/vendor/',
            },
            { source: './node_modules/babylonjs/babylon.js',
              destination: './public/code/vendor/babylonjs/',
            },
            { source: './node_modules/babylonjs-serializers/babylonjs.serializers.min.js',
              destination: './public/code/vendor/babylonjs/',
            },
            { source: './node_modules/babylonjs-materials/babylonjs.materials.min.js',
              destination: './public/code/vendor/babylonjs/',
            },
            { source: './node_modules/babylonjs-procedural-textures/babylon.grassProceduralTexture.min.js',
              destination: './public/code/vendor/babylonjs/',
            },
            { source: './node_modules/babylonjs-gui/babylon.gui.min.js',
              destination: './public/code/vendor/babylonjs/',
            },
            { source: './src/lib/plainjs/*.js', destination: './public/code'},
            { source: './assets/*', destination: './public' },
            { source: './assets/examples/**/', destination: './public/assets/examples' },
            { source: './pages/*.html', destination: './public/'},
            { source: './pages/*.pdf', destination: './public/'},
          ],
        }
      }
    })
  ],
   stats: {
      builtAt: true,
   },
  devtool: prod ? false : 'source-map',
  devServer: {
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: false,
      },
    },
     watchFiles: ['public/*.html'],
     static: {
        directory: path.join(__dirname,'public'),
     }
  }
};
