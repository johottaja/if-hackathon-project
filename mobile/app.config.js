// Optional subpath for static web hosting, e.g. EXPO_BASE_URL=/if-hackathon-project/app on GitHub Pages.
module.exports = ({ config }) =>
  process.env.EXPO_BASE_URL
    ? {
        ...config,
        experiments: {
          ...config.experiments,
          baseUrl: process.env.EXPO_BASE_URL,
        },
      }
    : config;
