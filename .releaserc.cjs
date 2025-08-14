module.exports = {
  // Release from either main or master; add prerelease branches later if needed
  branches: ['main', 'master'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: '# Changelog'
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github'
  ].concat(
    process.env.PUBLISH_NPM === 'true' && process.env.NPM_TOKEN ? [['@semantic-release/npm', { npmPublish: true }]] : []
  )
};
