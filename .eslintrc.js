module.exports = {
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module'
    },
    extends: 'eslint:recommended',
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-console': ['warn']
    },
    globals: {
        console: false,
        Promise: false
    }
}
