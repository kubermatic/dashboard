---
name: Release
title: [vX.XX] Release Preparation
assignees: @floreks @maciaszczykm @kgroschoff
about: The list of steps that should be executed prior to the official release
labels: sig/ui sig/release
---

### Release steps
Make sure to update all the below files prior to the release:

- [ ] Version bump in the following files:
  - [ ] `package.json`
  - [ ] `package-lock.json`
  - [ ] `Makefile`
- [ ] Update changelog file (`src/assets/config/changelog.json`) with the latest release notes  
