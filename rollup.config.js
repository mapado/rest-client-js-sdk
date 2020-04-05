import fs from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

const pkg = JSON.parse(fs.readFileSync('./package.json'));

const extensions = ['.ts', '.tsx', '.js', '.jsx'];

export default {
  input: 'src/index.js',
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
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
};
