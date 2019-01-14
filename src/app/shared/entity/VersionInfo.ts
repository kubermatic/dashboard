export class VersionInfo {
  dirty: boolean;
  distance: number;
  hash: string;
  raw: string;
  semver: Semver;
  semverString: string;
  suffix: string;
  tag: string;
}

export class Semver {
  build: string[];
  loose: boolean;
  major: number;
  minor: number;
  options: SemverOptions;
  patch: number;
  prerelease: string[];
  raw: string;
  version: string;
}

export class SemverOptions {
  includePrerelease: boolean;
  loose: boolean;
}
