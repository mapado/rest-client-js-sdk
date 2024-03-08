module.exports = {
  presets: [
    '@babel/typescript',
    [
      '@babel/env',
      {
        modules: false,
      },
    ],
  ],
  plugins: [
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
  ],
  env: {
    test: {
      presets: ['@babel/typescript', '@babel/preset-env'],
    },
  },
};
