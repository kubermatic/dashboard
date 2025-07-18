// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {SafeUrl} from '@angular/platform-browser';
import _ from 'lodash';
import * as y from 'js-yaml';
import semver from 'semver';

export const CLUSTER_AUTOSCALING_APP_DEF_NAME = 'cluster-autoscaler';

export class Application {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  namespace?: string;
  spec: ApplicationSpec;
  status?: ApplicationStatus;
  labels?: Record<ApplicationLabel | string, ApplicationLabelValue | string>;
  annotations?: Record<ApplicationAnnotations | string, string>;
}

export class ApplicationSpec {
  applicationRef: ApplicationRef;
  namespace: ApplicationNamespace;
  values?: string | object;
  valuesBlock?: string;
}

export class ApplicationRef {
  name: string;
  version: string;
}

export class ApplicationNamespace {
  create?: boolean;
  name: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export class ApplicationStatus {
  lastUpdated: Date;
  method: ApplicationMethod;
  conditions: ApplicationCondition[];
  applicationVersion: ApplicationVersion;
}

export class ApplicationCondition {
  type: string;
  status: string;
  reason: string;
  message: string;
}

export class ApplicationSettings {
  defaultNamespace?: string;
}

export class ApplicationDefinition {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  annotations?: Record<string, string>;
  labels?: Record<ApplicationLabel | string, ApplicationLabelValue | string>;
  spec: ApplicationDefinitionSpec;
}

export class ApplicationDefinitionSpec {
  defaultNamespace?: ApplicationNamespace;
  defaultValues?: string | object;
  defaultVersion?: string;
  enforced: boolean;
  default: boolean;
  selector: ApplicationDefinitionSelector;
  defaultValuesBlock?: string;
  description: string;
  displayName?: string;
  documentationURL?: string;
  sourceURL?: string;
  method: ApplicationMethod;
  versions: ApplicationVersion[];
  logo?: string;
  logoFormat?: string;
  logoData?: SafeUrl; // to be used as "src" value of image
}

export class ApplicationDefinitionSelector {
  datacenters: string[];
}

export class ApplicationVersion {
  version: string;
  constraints: ApplicationConstraints;
  template: ApplicationTemplate;

  static getVersionSource(version: ApplicationVersion): string {
    if (!version?.template?.source) {
      return '';
    }
    const source = version.template.source;
    return Object.keys(source).find(key => !!source[key]);
  }
}

export class ApplicationConstraints {
  k8sVersion: string;
  kkpVersion: string;
}

export class ApplicationTemplate {
  source: ApplicationSource;
}

export class ApplicationSource {
  helm: ApplicationHelmSource;
  git: ApplicationGitSource;
}

export class ApplicationHelmSource {
  chartName: string;
  chartVersion: string;
  url: string;
}

export class ApplicationGitSource {
  path: string;
  remote: string;
}

export enum ApplicationMethod {
  Helm = 'helm',
  Git = 'git',
}

export namespace ApplicationMethod {
  export function getMethodIcon(method: string) {
    switch (method) {
      case ApplicationMethod.Helm:
        return 'km-icon-helm';
      case ApplicationMethod.Git:
        return 'km-icon-git';
      default:
        return '';
    }
  }
}

export enum ApplicationLabel {
  ManagedBy = 'apps.kubermatic.k8c.io/managed-by',
  Type = 'apps.kubermatic.k8c.io/type',
}

export enum ApplicationAnnotations {
  Default = 'apps.kubermatic.k8c.io/defaulted',
  Enforce = 'apps.kubermatic.k8c.io/enforced',
  TargetDatacenters = 'apps.kubermatic.k8c.io/target-datacenters',
}

export enum ApplicationLabelValue {
  KKP = 'kkp',
  CNI = 'cni',
}

export function getApplicationLogoData(applicationDefinition: ApplicationDefinition): string {
  return applicationDefinition?.spec?.logo && applicationDefinition.spec.logoFormat
    ? `data:image/${applicationDefinition.spec.logoFormat};base64,${applicationDefinition.spec.logo}`
    : '';
}

export function getApplicationVersion(applicationDefinition: ApplicationDefinition): string {
  if (applicationDefinition.spec.defaultVersion) {
    // Ensure that the default version exists in the versions array
    if (
      applicationDefinition.spec.versions.some(version => version.version === applicationDefinition.spec.defaultVersion)
    ) {
      return applicationDefinition.spec.defaultVersion;
    }
  }

  // Find the highest semver version from the versions array
  const versions = applicationDefinition.spec.versions?.filter(version => version.version) ?? [];
  const sortedVersions = versions.sort((a, b) => {
    return semver.compare(a.version, b.version);
  });
  return sortedVersions[sortedVersions.length - 1].version;
}

export function createApplicationInstallation(appDef: ApplicationDefinition, defaultNamespace?: string): Application {
  const applicationInstallation: Application = {
    name: appDef.name,
    namespace: defaultNamespace || appDef.name,
    labels: appDef.labels ? {...appDef.labels} : {},
    spec: {
      applicationRef: {
        name: appDef.name,
        version: getApplicationVersion(appDef),
      },
      namespace: appDef.spec.defaultNamespace || {
        name: appDef.name,
        create: true,
      },
    },
  };

  if (!_.isEmpty(appDef.spec.defaultValuesBlock)) {
    applicationInstallation.spec.valuesBlock = appDef.spec.defaultValuesBlock;
  } else if (!_.isEmpty(appDef.spec.defaultValues)) {
    applicationInstallation.spec.valuesBlock = y.dump(appDef.spec.defaultValues);
  } else {
    applicationInstallation.spec.valuesBlock = '';
  }

  const annotations = new Map<string, string>();
  if (appDef.spec.default) {
    annotations.set(ApplicationAnnotations.Default, 'true');
  }
  if (appDef.spec.enforced) {
    annotations.set(ApplicationAnnotations.Enforce, 'true');
  }
  applicationInstallation.annotations = Object.fromEntries(annotations);

  return applicationInstallation;
}

export function isSystemApplication(labels: Record<string, string>): boolean {
  return labels?.[ApplicationLabel.ManagedBy] === ApplicationLabelValue.KKP;
}
