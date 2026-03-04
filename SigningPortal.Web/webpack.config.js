const path = require('path');
const glob = require('glob');
const fs = require('fs');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// Get all JS files inside wwwroot/js recursively
const files = glob.sync('./wwwroot/js/**/*.js');

const entries = {};
files.forEach(file => {
    // Skip already minified files
    if (file.endsWith('.min.js')) {
        const distPath = path.resolve(__dirname, 'wwwroot/dist', path.relative(path.resolve(__dirname, 'wwwroot/js'), file));

        // Ensure directory exists
        fs.mkdirSync(path.dirname(distPath), { recursive: true });

        // Copy file as-is into dist
        fs.copyFileSync(file, distPath);
        
    } else {
        // Get relative path from wwwroot/js
        const relativePath = path.relative(path.resolve(__dirname, 'wwwroot/js'), file);

        // Normalize slashes & remove .js extension
        const name = relativePath.replace(/\\/g, '/').replace(/\.js$/, '');

        entries[name] = file;
    }
});

module.exports = {
    entry: entries,
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'wwwroot/dist'),
    },
    mode: 'production',
    resolve: {
        preferRelative: true,
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true,
                    },
                },
            }),
        ],
    },
    plugins: [
        new CompressionPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: /\.js(\?.*)?$/i,
            threshold: 0, 
            minRatio: Infinity  
        })
    ]
};
