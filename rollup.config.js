import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

export default {
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  plugins: [
    commonjs(),
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
          },
        ],
      ],
    }),
  ],
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'rest-client-sdk',
      exports: 'named',
      sourcemap: true,
      globals: {
        'deep-diff': 'diff',
        urijs: 'URI',
      },
    },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
};
