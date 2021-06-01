'use strict';

var glob = require('glob');
var gaze = require('gaze');
var path = require('path');
var pluginutils = require('@rollup/pluginutils');
var spritesmith$1 = require('spritesmith');
var _ = require('lodash');
var templater = require('spritesheet-templates');
var mkdirpSync = require('mkdirp');
var fs = require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);
var gaze__default = /*#__PURE__*/_interopDefaultLegacy(gaze);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var spritesmith__default = /*#__PURE__*/_interopDefaultLegacy(spritesmith$1);
var ___default = /*#__PURE__*/_interopDefaultLegacy(_);
var templater__default = /*#__PURE__*/_interopDefaultLegacy(templater);
var mkdirpSync__default = /*#__PURE__*/_interopDefaultLegacy(mkdirpSync);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

const writeFileR = async (...args) => {
  const fileName = args[0];
  mkdirpSync__default['default'](path__default['default'].dirname(fileName));
  return fs__default['default'].writeFile(...args);
};

const sendToPast = (fileName, bypass) => {
  if (bypass) return Promise.resolve();
  return fs__default['default'].utimes(
    fileName,
    new Date(Date.now() - 10000),
    new Date(Date.now() - 10000)
  );
};

const writeCss = async (sources, templaterData, root) => {
  return await Promise.all(
    sources.map(async (css) => {
      const fileName = path__default['default'].join(root, css[0]);
      const code = templater__default['default'](templaterData, css[1]);
      await writeFileR(fileName, code);
      await sendToPast(fileName);

      return fileName;
    })
  );
};
const spriteSheetFormat = (spritesmithResult, options) => {
  const generateSpriteName = (fileName) => {
    return path__default['default'].parse(path__default['default'].relative(options.src.cwd, fileName)).name;
  };
  const sprites = ___default['default'].map(
    spritesmithResult.coordinates,
    function (oneSourceInfo, fileName) {
      return ___default['default'].assign({ name: generateSpriteName(fileName) }, oneSourceInfo);
    }
  );
  const spritesheet = ___default['default'].assign(
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

  spritesmith__default['default'].run(
    ___default['default'].merge({}, { src: files }, options.spritesmithOptions),
    (err, result) => {
      if (err) {
        throw err;
      }

      // write the sprite image file and stylesheet
      Promise.all([
        writeFileR(path__default['default'].join(root, target.image), result.image, 'binary'),
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
    (cssFileName) => MINE_TYPES[path__default['default'].parse(cssFileName).ext];

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

  const mergedOptions = ___default['default'].merge(
    {
      src: {
        options: {},
      },
      logCreatedFiles: false,
      apiOptions: {
        generateSpriteName: (fileName) =>
          path__default['default'].parse(path__default['default'].relative(mergedOptions.src.cwd, fileName)).name,
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
        `css format from extension "${path__default['default'].parse(css[0] || '').ext}" ` +
        `in "target.css[${i}]" and format was not specified explicitly`
      );
    }
  });

  ___default['default'].forEach(mergedOptions.customTemplates, (template, templateName) => {
    if (typeof template === 'string') {
      templater__default['default'].addHandlebarsTemplate(
        templateName,
        fs__default['default'].readFileSync(path__default['default'].join(root, template), 'utf-8')
      );
    } else if (typeof template === 'function') {
      templater__default['default'].addTemplate(templateName, template);
    } else {
      throw new Error(
        'custom template can be either path/to/handlebars/template or actual template function'
      );
    }
  });

  const handlebarsHelpers = mergedOptions.apiOptions.handlebarsHelpers;
  Object.keys(handlebarsHelpers).forEach((helperKey) => {
    templater__default['default'].registerHandlebarsHelper(helperKey, handlebarsHelpers[helperKey]);
  });

  return mergedOptions;
};

const handler = (customOptions, root) => {
  const options = processOptions(customOptions, root);
  const { src } = options;
  const init = () => {
    glob__default['default'](path__default['default'].join(root, src.cwd, src.glob), (err, files) => {
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
    gaze__default['default'](src.glob, { cwd: path__default['default'].join(root, src.cwd) }, (err, watcher) => {
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
  const filter = pluginutils.createFilter(customOptions.include, customOptions.exclude);
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

module.exports = spritesmith;
