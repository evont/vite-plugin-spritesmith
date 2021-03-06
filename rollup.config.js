// import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  external: [...Object.keys(pkg.dependencies), 'os'],
  output: [
    { file: pkg.main, format: 'cjs', exports: 'auto' },
    { file: pkg.module, format: 'es' }
  ],
  // plugins: [typescript({ sourceMap: false })]
};