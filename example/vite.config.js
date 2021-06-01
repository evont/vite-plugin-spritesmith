import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Spritesmith from '../';
import path from 'path';
import del from 'del';
const resolve = (dir) => path.join(process.cwd(), dir);
const spriteConfig = {
  imgTarget: resolve('src/sprite/img/'),
  scssTarget: resolve('src/sprite/style/')
};
del.sync([spriteConfig.imgTarget, spriteConfig.scssTarget]);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Spritesmith({
      watch: true,
      src: {
        cwd: resolve('./src/assets/sprites'),
        glob: '*.png',
      },
      target: {
        image:  `${spriteConfig.imgTarget}sprite.png`,
        // css: [
        //   [
        //     `${spriteConfig.scssTarget}sprite.scss`,
        //     {
        //       spritesheetName: 'vite2',
        //       format: 'handlebars_based_template',
        //     },
        //   ],
        // ],
        css: `${spriteConfig.scssTarget}sprite.scss`
      },
      apiOptions: {
        cssImageRef: 'sprite/img/sprite.png',
        spritesheet_info: {
          name: 'vite1',
        },
        retina_spritesheet_info: {
          name: 'vi-retina',
        }
      },
      // customTemplates: {
      //   handlebars_based_template: resolve('./src/scss.handlebars'),
      // },
      retina: {
        classifier(p) {
          let type = 'normal';
          let normalName = p;
          let retinaName = p.replace('.png', '@2x.png');
          if (p.endsWith('@2x.png')) {
            type = 'retina';
            normalName = p.replace('@2x.png', '.png');
            retinaName = p;
          }
          return {
            type,
            normalName,
            retinaName,
          };
        },
        targetImage: `${spriteConfig.imgTarget}sprite-retina.png`,
        cssImageRef: 'sprite/img/sprite-retina.png',
      },
    }),
  ],
});
