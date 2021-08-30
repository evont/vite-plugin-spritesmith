# vite-plugin-spritesmith ![npm](https://img.shields.io/npm/v/vite-plugin-spritesmith)

[![NPM](https://nodei.co/npm/vite-plugin-spritesmith.png)](https://nodei.co/npm/vite-plugin-spritesmith/)

A Vite plugin that converts a set of images into a spritesheet and SASS/LESS/Stylus mixins, using
[spritesmith](https://github.com/Ensighten/spritesmith) and [spritesheet-templates](https://github.com/twolfson/spritesheet-templates)

## Install

```bash
# use yarn (recommend)
yarn add -D vite-plugin-spritesmith
# or use npm
npm install --save-dev vite-plugin-spritesmith
```


## Example

Let's say you have the following folder structure

```
/
|-src
| |-assets
| | |-sprites
| | | |-new.png
| | | |-open.png
| | | |-save.png
| | ...
| |-scss.handlebars
| ...
|-vite.config.js

```

Then you need to instantiate the plugin in the vite config like this:

```javascript
import { defineConfig } from 'vite';
import Spritesmith from '@vitejs/plugin-spritesmith';
export default defineConfig({
  plugins: [
    Spritesmith({
      watch: true,
      src: {
        cwd: './src/assets/sprites',
        glob: '*.png',
      },
      target: {
        image: './src/assets/target/spri·te.png',
        css: [
          [
            './src/assets/style/sprite.scss',
            {
              format: 'handlebars_based_template',
            },
          ],
        ],
      },
      apiOptions: {
        cssImageRef: 'assets/target/sprite.png',
        spritesheet_info: {
          name: 'vite1',
          format: 'handlebars_based_template',
        },
      },
      customTemplates: {
        handlebars_based_template: './src/scss.handlebars',
      },
    }),
  ],
});
```

And then just use it

```scss
@import './assets/style/sprite.scss';
.icon {
  @include sprites($spritesheet-sprites);
}
```

So the way generated image is accessed from the generated API now must be specified manually.

## Config
- `watch` - should watch source images change or not, default `false`
- `src` - used to build a list of source images

  - `cwd` should be the closest common directory for all source images;
  - `glob` path pattern of source images 

  `cwd` and `glob` both will be passed directly to [glob](https://github.com/isaacs/node-glob) (and [gaze](https://github.com/shama/gaze)
  in watch mode), then the resulting list of files will be used as a list of source images

- `target` - generated files

  - `image` - the target image's filename.
  - `css` - can be one of the following

    - `"full/path/to/spritesheet/api"` - for example `path.resolve(__dirname, 'src/spritesmith-generated/sprite.styl')`
    - `["full/path/to/spritesheet/api1", "full/path/to/spritesheet/api2"]`,
    - `["full/path/to/spritesheet/api1", ["full/path/to/spritesheet/api2", spritesmithTemplatesOptions]]`
      spritesmithTemplatesOptions - is the second argument [here](https://github.com/twolfson/spritesheet-templates#templaterdata-options)

      for example

      ```javascript
          ...
          css: [
              path.resolve(__dirname, 'src/spritesmith-generated/sprite.styl'),
              [path.resolve(__dirname, 'src/spritesmith-generated/sprite.json'), {
                  format: 'json_texture'
              }]
          ]
      ```

- `apiOptions` - optional
  - `generateSpriteName` - a function. Takes a full path to a source image file and expected to return
    name by which it will be referenced in API. Return value will be used as `sprite.name` for
    [spritesheet-templates](https://github.com/twolfson/spritesheet-templates). Default behaviour is to
    use filename (without dirname and extension)
  - `spritesheet_name`, `retina_spritesheet_name` - passed to [spritesheet-templates](https://github.com/twolfson/spritesheet-templates) (`retina_spritesheet_name` only takes effect if `apiOptions.retina` is also specified)
  - `cssImageRef` - a path by which a generated image will be referenced in API. If target.image is interpolated, `cssImageRef` should be interpolated the same way too.
  - `handlebarsHelpers` - an object. Container for helpers to register to handlebars for our template
    - Each key-value pair is the name of a handlebars helper corresponding to its function
    - For example, `{half: function (num) { return num/2; }` will add a handlebars helper that halves numbers
    - Note that handlebarsHelpers is global. If you have multiple instances of SpritesmithPlugin, helpers defined later will override helpers defined earlier.
- `spritesmithOptions` - optional. Options for [spritesmith](https://github.com/Ensighten/spritesmith)
- `retina` - optional, when specified, uses retina capabilities of [spritesheet-templates](https://github.com/twolfson/spritesheet-templates). Can be either a suffix string (like '@2x') or an object consisting of three fields:

  - `classifier` - `Function` that allows to say which source is for retina spritesheet and which is not. Will be called with full path to source file, and should return an object of this format -

    ```javascript

        {
            type: String, // determines which kind of source is this. May take one of the two values: 'retina' and 'normal'
            normalName: String, //a full path to the corresponding normal source image
            retinaName: String, //a full path to the corresponding retina source image
        }
    ```

  - `targetImage` - a full path to the generated retina image
  - `cssImageRef` - a path by which generated image will be referenced in the API

  When used as a suffix string it applies to source files, a filename for retina spritesheet image and cssImageRef

  `apiOptions.generateSpriteName` will be applied to `normalName` returned by `retina.classifier`

- `customTemplates` - optional. An object with keys and values corresponding to format names and template descriptions respectively.
  Template description can be either a `path/to/handlebars/template/file` or a template function

  You can use templates registered here as `format` in "target.css"

## License

MIT