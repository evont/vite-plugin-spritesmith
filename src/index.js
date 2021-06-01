import glob from 'glob';
import gaze from 'gaze';
import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import compile from './lib/compile';
import processOptions from './lib/processOption';

const handler = (customOptions, root) => {
  const options = processOptions(customOptions, root);
  const { src } = options;
  const init = () => {
    glob(path.join(root, src.cwd, src.glob), (err, files) => {
      if (err) {
        throw err;
      }
      compile(
        files,
        options,
        root
      );
    });
  };
  init();
  if (options.watch) {
    gaze(src.glob, { cwd: path.join(root, src.cwd) }, (err, watcher) => {
      watcher.on('all', init);
    });
  }
};

/**
 * entry of plugin
 * @param {{
 *    src: { cwd: string; glob: string; };
 *    target: { image: string; css: string | string[] };
 *    apiOptions: { cssImageRef: string; generateSpriteName: (image: string) => string; handlebarsHelpers: Record<string, (helperFn) => void> };
 *    spritesmithOptions: any;
 *    customTemplates: Record<string, string | () => string>;
 *    retina: { classifier: (imgpath: string) => { type: string; normalName: string; retinaName: string; }; targetImage: string; cssImageRef: string; }
 * }} customOptions
 * @returns
 */
const spritesmith = (customOptions) => {
  const filter = createFilter(customOptions.include, customOptions.exclude);
  let isHandled = false;
  let config;
  let root;
  return {
    name: '@rollup/spritesmith',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      root = config.root;
    },
    load(id) {
      if (!filter(id) || isHandled) {
        return;
      }
      isHandled = true;
      handler(customOptions, root);
    },
  };
};

export default spritesmith;
