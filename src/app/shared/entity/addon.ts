export class Addon {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec?: AddonSpec;
}

export class AddonSpec {
  isDefault?: boolean;
  variables?: object;
}

export class AddonConfig {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec: AddonConfigSpec;
}

export class AddonConfigSpec {
  shortDescription: string;
  description: string;
  logo: string;
  logoFormat: string;
  formSpec: AddonFormSpec[];
}

export class AddonFormSpec {
  displayName: string;
  internalName: string;
  required: boolean;
  type: string;
}

export function hasAddonFormData(addonConfig: AddonConfig) {
  return !!addonConfig && !!addonConfig.spec && !!addonConfig.spec.formSpec;
}

export function hasAddonLogoData(addonConfig: AddonConfig): boolean {
  return !!addonConfig && !!addonConfig.spec && !!addonConfig.spec.logo && !!addonConfig.spec.logoFormat;
}

// Before using it in HTML it has to be go through DomSanitizer.bypassSecurityTrustUrl() method.
export function getAddonLogoData(addonConfig: AddonConfig): string {
  return addonConfig && addonConfig.spec
    ? `data:image/${addonConfig.spec.logoFormat};base64,${addonConfig.spec.logo}`
    : '';
}

export function getAddonShortDescription(addonConfig: AddonConfig): string {
  return addonConfig && addonConfig.spec ? addonConfig.spec.shortDescription : '';
}
