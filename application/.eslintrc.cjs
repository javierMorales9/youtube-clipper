/** @type {import("eslint").Linter.Config} */
const config = {
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": true
  },
  "plugins": [
    "@typescript-eslint",
    "drizzle"
  ],
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked"
  ],
  "rules": {
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/no-unsafe-argument": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-this-alias": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        "prefer": "type-imports",
        "fixStyle": "inline-type-imports"
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": {
          "attributes": false
        }
      }
    ],
    "drizzle/enforce-delete-with-where": [
      "error",
      {
        "drizzleObjectName": [
          "db"
        ]
      }
    ],
    "drizzle/enforce-update-with-where": [
      "error",
      {
        "drizzleObjectName": [
          "db"
        ]
      }
    ]
  }
}
module.exports = config;
