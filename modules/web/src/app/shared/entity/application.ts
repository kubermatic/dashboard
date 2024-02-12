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

export class Application {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  namespace?: string;
  spec: ApplicationSpec;
  status: ApplicationStatus;
  labels?: Record<ApplicationLabel | string, ApplicationLabelValue | string>;
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

export class ApplicationDefinition {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  spec: ApplicationDefinitionSpec;
}

export class ApplicationDefinitionSpec {
  defaultValues?: string | object;
  defaultValuesBlock?: string;
  description: string;
  documentationURL?: string;
  sourceURL?: string;
  method: ApplicationMethod;
  versions: ApplicationVersion[];
  logo?: string;
  logoFormat?: string;
  logoData?: SafeUrl; // to be used as "src" value of image
  labels?: Record<ApplicationLabel | string, ApplicationLabelValue | string>;
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
}

export enum ApplicationLabelValue {
  KKP = 'kkp',
}

// Before using it in HTML it has to be go through DomSanitizer.bypassSecurityTrustUrl() method.
export function getApplicationLogoData(applicationDefinition: ApplicationDefinition): string {
  return applicationDefinition?.spec?.logo && applicationDefinition.spec.logoFormat
    ? `data:image/${applicationDefinition.spec.logoFormat};base64,${applicationDefinition.spec.logo}`
    : '';
}
