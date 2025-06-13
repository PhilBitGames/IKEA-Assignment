const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development', 
    entry: './src/main.ts', 
    output: {
        filename: 'bundle.[contenthash].js', 
        path: path.resolve(__dirname, 'dist'), 
        publicPath: './', 
    },
    resolve: {
        extensions: ['.ts', '.js'], 
    },
    module: {
        rules: [
            {
                test: /\.ts$/, 
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'], 
            },
            {
                test: /\.(gltf|glb)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'models/[name].[ext]', 
                },
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name].[ext]',
                },
            },

        ],
    },
    plugins: [
        new CleanWebpackPlugin(), 
        new HtmlWebpackPlugin({
            template: './index.html', 
            filename: 'index.html', 
            inject: 'body',
        }),
        new CopyPlugin({
            patterns: [
                { from: 'styles.css', to: 'styles.css' },
            ],
        }),
    ],

    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'), 
        },
        compress: true,
        port: 8080,
        open: true,
    },
};