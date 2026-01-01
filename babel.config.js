module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Disable plugins that might cause issues
          unstable_transformProfile: 'default',
        },
      ],
    ],
    plugins: [],
  };
};

