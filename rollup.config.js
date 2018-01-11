import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

export default {
  input: 'src/index.js',
  plugins: [
    commonjs(),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [
        [
          'env',
          {
            modules: false,
          },
        ],
      ],
      plugins: ['external-helpers'],
    }),
  ],
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'rest-client-sdk',
      exports: 'named',
      sourcemap: true,
    },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
};
