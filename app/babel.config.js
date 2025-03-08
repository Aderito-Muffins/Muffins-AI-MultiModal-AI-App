module.exports = function (api) {
  api.cache(true); // Ativa o cache do Babel para melhorar o desempenho.
  return {
    presets: ["babel-preset-expo"], // Preset do Expo, necessário para trabalhar com projetos Expo.
    plugins: ["react-native-reanimated/plugin"],
  };
};
