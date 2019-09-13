module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": false
    },
    "extends": "eslint:recommended",

    "parserOptions": {
        "ecmaVersion": 5,
        "sourceType": "script",
    },

    "globals": {
      "angular": "readonly",
      "AudioPlugin": "writable",
      "firebase": "writable",
      "THREE": "readonly",
      "cordova": "readonly",
      "StatusBar": "readonly",
    },

    "rules": {
        "indent": [ "error", "tab" ], // auto-fix
        "linebreak-style": [ "error", "unix" ], // auto-fix
        "quotes": [ "error", "single" ], // auto-fix
        "semi": [ "error", "always" ], // auto-fix
        "no-console": "off", // auto-fix

        "no-unused-vars": "warn",
        "no-redeclare": "warn",
        "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
    }
};
