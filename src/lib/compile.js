import spritesmith from 'spritesmith';
import _ from 'lodash';
import templater from 'spritesheet-templates';
import path from 'path';

import { writeFileR, sendToPast } from './util';

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

  spritesmith.run(
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

export default compile;
