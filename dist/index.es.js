import glob from 'glob';
import gaze from 'gaze';
import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import spritesmith$1 from 'spritesmith';
import _ from 'lodash';
import templater from 'spritesheet-templates';
import mkdirpSync from 'mkdirp';
import fs from 'fs-extra';

const writeFileR = async (...args) => {
  const fileName = args[0];
  mkdirpSync(path.dirname(fileName));
  return fs.writeFile(...args);
};

const sendToPast = (fileName, bypass) => {
  if (bypass) return Promise.resolve();
  return fs.utimes(
    fileName,
    new Date(Date.now() - 10000),
    new Date(Date.now() - 10000)
  );
};

const writeCss = async (sources, templaterData, root) => {
  return await Promise.all(
    sources.map(async (css) => {
      const fileName = path.join(root, css[0]);
      const code = templater(templaterData, css[1]);
      await writeFileR(fileName, code);
      await sendToPast(fileName);

      return fileName;
    })
  );
};
const spriteSheetFormat = (spritesmithResult, options) => {
  const generateSpriteName = (fileName) => {
    return path.parse(path.relative(options.src.cwd, fileName)).name;
  };
  const sprites = _.map(
    spritesmithResult.coordinates,
    function (oneSourceInfo, fileName) {
      return _.assign({ name: generateSpriteName(fileName) }, oneSourceInfo);
    }
  );
  const spritesheet = _.assign(
    { image: options.apiOptions.cssImageRef },
    spritesmithResult.properties
  );

  return {
    sprites: sprites,
    spritesheet: spritesheet,
    spritesheet_info: options.apiOptions.spritesheet_info
  };
};

const compile = (files, options, root, useRetina = false) => {
  console.log(useRetina);
  const { target } = options;

  spritesmith$1.run(
    _.merge({}, { src: files }, options.spritesmithOptions),
    (err, result) => {
      if (err) {
        throw err;
      }

      // write the sprite image file and stylesheet
      Promise.all([
        writeFileR(path.join(root, target.image), result.image, 'binary'),
        // writeFileR(path.join(root, target.css), spriteSheetContent),
        writeCss(
          target.css,
          spriteSheetFormat(result, options),
          root
        ),
      ]);
    }
  );
};

const MINE_TYPES = {
  '.stylus': 'stylus',
  '.styl': 'stylus',
  '.sass': 'sass',
  '.scss': 'scss',
  '.less': 'less',
  '.json': 'json',
  '.css': 'css',
};
const fThrowExpectField = (f) => { throw `Expected field "${f}" in options of SpritesmithPlugin`; };

const extractFormatFromCSSFilename =
    (cssFileName) => MINE_TYPES[path.parse(cssFileName).ext];

const normalizeTargetCss = (mergedOptions) => {
  let css = mergedOptions.target.css;

  if (!Array.isArray(css)) {
    css = [[css, mergedOptions.spritesheetTemplatesOptions]];
  }

  return css.map((css, i) => {
    if (typeof css === 'string') {
      return [
        css,
        {
          format: extractFormatFromCSSFilename(css),
        },
      ];
    }
    if (Array.isArray(css)) {
      const [cssFileName, options = {}] = css.slice(0);
      const format =
        options.format || extractFormatFromCSSFilename(cssFileName);
      return [cssFileName, { ...options, format }];
    }
    throw new Error(`'target.css[${i}] must be String or Array'`);
  });
};

const processOptions = (rawOptions, root) => {
  rawOptions.src || fThrowExpectField('src');
  rawOptions.src.cwd || fThrowExpectField('src.cwd');
  rawOptions.src.glob || fThrowExpectField('src.glob');
  rawOptions.target || fThrowExpectField('target');
  rawOptions.target.css || fThrowExpectField('target.css');
  rawOptions.target.image || fThrowExpectField('target.image');

  const mergedOptions = _.merge(
    {
      src: {
        options: {},
      },
      logCreatedFiles: false,
      apiOptions: {
        generateSpriteName: (fileName) =>
          path.parse(path.relative(mergedOptions.src.cwd, fileName)).name,
        cssImageRef: rawOptions.target.image,
        customTemplates: {},
        handlebarsHelpers: {},
      },
      spritesmithOptions: {},
      spritesheetTemplatesOptions: {},
    },
    rawOptions
  );
  mergedOptions.target.css = normalizeTargetCss(mergedOptions);
  mergedOptions.target.css.forEach((css, i) => {
    if (!css[1].format) {
      throw (
        'SpritesmithPlugin was unable to derive ' +
        `css format from extension "${path.parse(css[0] || '').ext}" ` +
        `in "target.css[${i}]" and format was not specified explicitly`
      );
    }
  });

  _.forEach(mergedOptions.customTemplates, (template, templateName) => {
    if (typeof template === 'string') {
      templater.addHandlebarsTemplate(
        templateName,
        fs.readFileSync(path.join(root, template), 'utf-8')
      );
    } else if (typeof template === 'function') {
      templater.addTemplate(templateName, template);
    } else {
      throw new Error(
        'custom template can be either path/to/handlebars/template or actual template function'
      );
    }
  });

  const handlebarsHelpers = mergedOptions.apiOptions.handlebarsHelpers;
  Object.keys(handlebarsHelpers).forEach((helperKey) => {
    templater.registerHandlebarsHelper(helperKey, handlebarsHelpers[helperKey]);
  });

  return mergedOptions;
};

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
