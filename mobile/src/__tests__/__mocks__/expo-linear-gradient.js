// Mock for expo-linear-gradient
const React = require('react');
const { View } = require('react-native');

const LinearGradient = (props) => {
  return React.createElement(View, props, props.children);
};

module.exports = {
  LinearGradient,
};
