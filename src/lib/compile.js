import spritesmith from 'spritesmith';
import _ from 'lodash';
import templater from 'spritesheet-templates';
import path from 'path';

import { writeFileR, sendToPast, promiseCall } from './util';

const writeCss = async (sources, templaterData) => {
  return await Promise.all(
    sources.map(async (css) => {
      const fileName = css[0];
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
    spritesheet_info: options.apiOptions.spritesheet_info,
  };
};

const compileNormal = (files, options) => {
  const { target } = options;
  spritesmith.run(
    _.merge({}, { src: files }, options.spritesmithOptions),
    (err, result) => {
      if (err) {
        throw err;
      }
      const spritesheetTemplatesData = spriteSheetFormat(result, options);
      // write the sprite image file and stylesheet
      Promise.all([
        writeFileR(target.image, result.image, 'binary'),
        writeCss(target.css, spritesheetTemplatesData),
      ]);
    }
  );
};

function getSpritesForSpritesheetTemplates(
  combinedSources,
  prefix,
  field,
  sourceField
) {
  return _.map(combinedSources, (sprite) => ({
    name: prefix + sprite.apiName,
    source_image: sprite[sourceField],
    x: sprite[field].x,
    y: sprite[field].y,
    width: sprite[field].width,
    height: sprite[field].height,
  }));
}

const compileRetina = async (files, options) => {
  const { src, target, retina, apiOptions, spritesmithOptions } = options;
  // const { target } = options;
  const sourceRecords = files.map((fileName) => {
    const oneRecord = retina.classifier(path.resolve(src.cwd, fileName));
    return {
      ...oneRecord,
      apiName: apiOptions.generateSpriteName(oneRecord.normalName),
    };
  });

  const combinedSources = _.map(
    _.groupBy(sourceRecords, 'apiName'),
    (group) => {
      const result = _.clone(group[0]);
      group.forEach((oneRecord) => {
        result[oneRecord.type] = true;
      });
      return result;
    }
  );

  const results = await Promise.all([
    promiseCall(
      spritesmith.run.bind(spritesmith, {
        ...spritesmithOptions,
        src: _.map(combinedSources, 'normalName'),
      })
    ),
    promiseCall(
      spritesmith.run.bind(spritesmith, {
        ...spritesmithOptions,
        src: _.map(combinedSources, 'retinaName'),
        padding: (spritesmithOptions.padding || 0) * 2,
      })
    ),
  ]);

  combinedSources.forEach((oneSource) => {
    oneSource.normalCoordinates = results[0].coordinates[oneSource.normalName];
    oneSource.retinaCoordinates = results[1].coordinates[oneSource.retinaName];
  });

  const normalSprites = getSpritesForSpritesheetTemplates(
    combinedSources,
    '',
    'normalCoordinates',
    'normalName'
  );
  const retinaSprites = getSpritesForSpritesheetTemplates(
    combinedSources,
    'retina_',
    'retinaCoordinates',
    'retinaName'
  );

  const spritesheetTemplatesData = {
    retina_spritesheet_info: apiOptions.retina_spritesheet_info,
    sprites: normalSprites,
    spritesheet: {
      width: results[0].properties.width,
      height: results[0].properties.height,
      image: apiOptions.cssImageRef,
    },
    retina_sprites: retinaSprites,
    retina_spritesheet: {
      width: results[1].properties.width,
      height: results[1].properties.height,
      image: retina.cssImageRef,
    },
    retina_groups: combinedSources.map((sprite, i) => ({
      name: sprite.apiName,
      index: i,
    })),
  };

  Promise.all([
    writeFileR(target.image, results[0].image, 'binary'),
    writeFileR(retina.targetImage, results[1].image, 'binary'),
    writeCss(target.css, spritesheetTemplatesData),
  ]);
};

const compile = (files, options, useRetina = false) => {
  let compileStrategy = useRetina ? compileRetina : compileNormal;
  compileStrategy(files, options);
};

export default compile;
