import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

export default {
  entry: 'src/index.js',
  exports: 'named',
  moduleName: 'rest-client-sdk',
  plugins: [
    commonjs({
      namedExports: {
        'node_modules/immutable/dist/immutable.js': ['fromJS'],
      },
    }),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [
        ['latest', {
          es2015: {
            modules: false,
          },
        }],
      ],
      plugins: ['external-helpers'],
    }),
  ],
  targets: [
    { dest: pkg.main, format: 'umd' },
    { dest: pkg.module, format: 'es' },
  ],
};
