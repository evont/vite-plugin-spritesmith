import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import templater from 'spritesheet-templates';

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
export default processOptions;
