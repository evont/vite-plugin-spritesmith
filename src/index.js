import glob from 'glob';
import gaze from 'gaze';
import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import compile from './lib/compile';
import processOptions from './lib/processOption';

const handler = (customOptions) => {
  const options = processOptions(customOptions);
  const { src } = options;
  const init = () => {
    glob(path.join(src.cwd, src.glob), (err, files) => {
      if (err) {
        throw err;
      }
      compile(
        files,
        options,
        'retina' in options
      );
    });
  };
  init();
  if (options.watch) {
    gaze(src.glob, { cwd: src.cwd }, (err, watcher) => {
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
  return {
    name: 'vite:spritesmith',
    load(id) {
      if (!filter(id) || isHandled) {
        return;
      }
      isHandled = true;
      handler(customOptions);
    },
  };
};

export default spritesmith;
