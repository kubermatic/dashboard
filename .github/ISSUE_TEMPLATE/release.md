---
name: Release
title: [vX.XX] Release Procedure
assignees: @floreks @maciaszczykm @kgroschoff
about: The list of steps that should be executed prior to the official release
labels: sig/ui sig/release
---

## Release Procedure
List of steps to follow after finishing the [pre-release procedure](docs/manuals/release.md#pre-release-procedure).

### Important
Keep in sync with [documentation](docs/manuals/release.md#release-procedure).

- [ ] Version bump in the following files:
  - [ ] `package.json`
  - [ ] `package-lock.json`
  - [ ] `Makefile`
- [ ] Update changelog file (`src/assets/config/changelog.json`) with the latest release notes  
