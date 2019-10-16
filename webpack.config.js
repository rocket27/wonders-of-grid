const path = require('path');

module.exports = {
    entry: {
        main: "./source/js/index.js",
    },
    output: {
        filename: 'bundle.js',
        // chunkFilename: '[name].[contenthash].bundle.js',
        path: path.resolve(__dirname, './dist'),
    },
    // optimization: {
    //     splitChunks: {
    //         cacheGroups: {
    //             vendor: {
    //                 test: /node_modules/,
    //                 chunks: "initial",
    //                 name: "vendor",
    //                 enforce: true
    //             }
    //         }
    //     }
    // },
    // optimization: {
    //     minimize: build,
    // },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: require.resolve('babel-loader'),
                    query: {
                        presets: [
                            ['@babel/preset-env', { modules: false }],
                        ],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['*', '.js'],
        alias: {
            source: path.resolve(__dirname, 'source/'),
        },
    },
};
