/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only changes
        "style", // Code style changes (formatting, etc.)
        "refactor", // Code refactor without bug fix or feature
        "perf", // Performance improvements
        "test", // Test additions or updates
        "build", // Build-related changes
        "ci", // CI-related changes
        "chore", // Maintenance tasks
        "revert", // Revert a previous commit
      ],
    ],
    "subject-case": [
      2,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"],
    ],
    "header-max-length": [2, "always", 150],
  },
};
