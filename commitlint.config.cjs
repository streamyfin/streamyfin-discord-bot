module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Accept chore(release): ... as valid
    'type-enum': [2, 'always', ['chore', 'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'release']],
    'subject-empty': [2, 'never'],
  },
};