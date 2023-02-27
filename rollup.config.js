import { uglify } from 'rollup-plugin-uglify';
import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: [
    {
      globals: {
        axios: 'axios',
      },
      file: pkg.main,
      format: 'cjs',
      exports: 'auto',
    },
    {
      globals: {
        axios: 'axios',
      },
      name: 'feishu',
      file: `dist/feishu-push-v${pkg.version}.js`,
      format: 'umd',
    },
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
    }),
    uglify(),
    commonjs({
      browser: true
    }),
    resolve({
      browser: true
    })
  ],
}
