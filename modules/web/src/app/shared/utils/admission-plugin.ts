// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {AbstractControl} from '@angular/forms';
import {Datacenter} from '../entity/datacenter';
import {GlobalEventRateLimitPluginConfiguration} from '../entity/cluster';

export enum AdmissionPlugin {
  PodSecurityPolicy = 'PodSecurityPolicy',
  PodNodeSelector = 'PodNodeSelector',
  EventRateLimit = 'EventRateLimit',
}

export const EMPTY_EVENT_RATE_LIMIT_CONFIG: GlobalEventRateLimitPluginConfiguration = {
  enabled: false,
  enforced: false,
  defaultConfig: {},
};

export class AdmissionPluginUtils {
  static getPluginName(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim();
  }

  static getJoinedPluginNames(plugins: string[]): string {
    return plugins.map(plugin => this.getPluginName(plugin)).join(', ');
  }

  static isPluginEnabled(form: AbstractControl, name: string): boolean {
    return !!form.value && form.value.some(x => x === name);
  }

  static isPodSecurityPolicyEnforced(datacenter: Datacenter): boolean {
    return !!datacenter && !!datacenter.spec && !!datacenter.spec.enforcePodSecurityPolicy;
  }

  static updateSelectedPluginArray(form: AbstractControl, name: string): string[] {
    const plugins: string[] = form.value ? form.value : [];
    if (!plugins.some(x => x === name)) {
      plugins.push(name);
    }
    return plugins;
  }
}
