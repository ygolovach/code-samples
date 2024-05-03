import { resolve, parse } from 'path';
import {sync} from 'glob';
import { Configuration } from 'webpack';
import webpack = require("webpack");

const config: Configuration = {
    entry: sync('./handlers/**.ts').reduce((obj:{[key: string]: string}, el) => {
        obj[parse(el).name] = el;
        return obj
    },{}),
    optimization: { minimize: false },
    output: {
        filename: '[name]/index.js',
        libraryTarget: 'commonjs2',
        path: resolve(__dirname, 'build'),
    },
    module: {
        rules: [{ test: /\.ts$/, loader: 'ts-loader' }],
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    target: 'node',
    mode: process.env.NODE_ENV === 'dev' ? 'development' : 'production',
    plugins: [
        new webpack.IgnorePlugin({resourceRegExp: /^pg-native$/})
    ],


};

export default config;
