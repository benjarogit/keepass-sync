# Release & Versioning

Version in `package.json` and Git tags stay in sync (e.g. `v2.0.0`).

## Release workflow

1. Update code and docs
2. Bump version in `package.json`
3. Update `CHANGELOG.md`
4. Commit, then: `git tag vX.Y.Z`
5. Push: `git push origin main --tags`
6. Create GitHub Release from tag with release notes
7. npm publish: `npm publish --access public` (if not yet published)

## GitHub repository

- **Description:** Sync & merge KeePass/KeePassXC database over FTP, SFTP, SMB, SCP. Node.js CLI.
- **Topics:** `keepass`, `keepassxc`, `password-manager`, `sync`, `ftp`, `sftp`, `nodejs`, `cli`
