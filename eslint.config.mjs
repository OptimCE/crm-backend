import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    // 1. Global Ignores
    {
      ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/*.js"]
    },

    // 2. Base Configurations
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,

    // 3. Custom Rules
    {
      files: ["**/*.ts"],
      languageOptions: {
        globals: globals.node,
        parserOptions: {
          project: "./tsconfig.eslint.json",
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_"
          }
        ]
      }
    }
);