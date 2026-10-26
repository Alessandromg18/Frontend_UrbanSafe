module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // El plugin de reanimated debe ir siempre al final
      "react-native-reanimated/plugin",
    ],
  };
};