module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2021
    },
    env: {
        node: true,
        jest: true,
        es6: true
    },
    extends: ['eslint:recommended'],
    rules: {
        indent: ['error', 4],
        quotes: ['warn', 'single']
    }
};
