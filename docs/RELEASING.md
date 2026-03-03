# Release & Versioning

Version in `package.json` and Git tags stay in sync (e.g. `v2.0.0`).

## Release workflow

1. Update code and docs
2. Bump version in `package.json`
3. Commit, then: `git tag vX.Y.Z`
4. Push: `git push origin main --tags`
5. Create GitHub Release from tag – use **Generate release notes** for automatic notes from commits
6. npm publish: `npm publish --access public` (if publishing to npm)

## GitHub repository

- **Description:** Sync & merge KeePass/KeePassXC database over FTP, SFTP, SMB, SCP. Node.js CLI.
- **Topics:** `keepass`, `keepassxc`, `password-manager`, `sync`, `ftp`, `sftp`, `nodejs`, `cli`
