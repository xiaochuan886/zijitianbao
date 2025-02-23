module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { 
      runtime: 'automatic',
      development: true,
      importSource: '@emotion/react'
    }],
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@emotion/babel-plugin',
  ],
}; 