module.exports = function (api) {
  api.cache(true); // Ensure caching is enabled
  return {
    presets: ['babel-preset-expo'], // For Expo projects
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env', // Ensures the `@env` module is used
          path: '.env',       // Path to your `.env` file
          verbose: false,     // Set to true for debugging
        },
      ],
    ],
  };
};
