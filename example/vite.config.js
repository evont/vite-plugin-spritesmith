import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Spritesmith from '../';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Spritesmith({
      watch: true,
      src: {
        cwd: './src/assets/sprites',
        glob: '*.png',
      },
      target: {
        image: './src/assets/starget/sprite.png',
        css: [
          ['./src/assets/style/sprite.scss',
          {
            format: 'handlebars_based_template'
          }]
        ]
      },
      apiOptions: {
        cssImageRef: 'assets/starget/sprite.png',
        spritesheet_info: {
          name: 'vite1',
          format: 'handlebars_based_template'
        }
      },
      customTemplates: {
        handlebars_based_template: './src/scss.handlebars',
      },
    }),
  ],
});
