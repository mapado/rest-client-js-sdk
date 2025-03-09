import { readFileSync } from 'node:fs';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const pkg = JSON.parse(readFileSync('./package.json'));

const extensions = ['.ts', '.tsx', '.js', '.jsx'];

export default {
  input: 'src/index.ts',
  external: Object.keys(pkg.dependencies),
  plugins: [
    commonjs(),
    resolve({ extensions }),
    babel({
      extensions,
      exclude: 'node_modules/**',
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
    { file: pkg.exports['.'].default, format: 'es', sourcemap: true },
  ],
};
