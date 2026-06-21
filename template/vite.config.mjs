import muten from '@karttofer/muten/vite-plugin-muten.js';

export default {
  plugins: [muten()], // theme.muten is auto-loaded; everything else stays .muten
};
