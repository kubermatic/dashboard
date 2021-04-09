---
name: Release
about: Use this template before the official release to make sure that all required files have been updated
labels: sig/ui sig/release
---

### Release steps
Make sure to perform all the below steps prior to the release:

- Version bump in the following files:
  - [ ] `package.json`
  - [ ] `package-lock.json`
  - [ ] `Makefile`
- Update changelog file (`src/assets/config/changelog.json`) with the latest release notes  
