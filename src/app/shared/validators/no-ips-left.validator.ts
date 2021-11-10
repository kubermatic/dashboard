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

import {AbstractControl, ValidatorFn} from '@angular/forms';
import {MachineNetwork} from '../entity/cluster';
import {getIpCount} from '../functions/get-ip-count';

// NoIpsLeftValidator will validate if there are enough ips left to create given amount of nodes
// a cluster could have more than one ip ranges
// if gateway ip is in ip range we have to substract it from ipCount
export function NoIpsLeftValidator(networks: MachineNetwork[], existingNodes: number): ValidatorFn {
  return (control: AbstractControl): {[key: string]: boolean} | null => {
    if (networks) {
      const ipCount = getIpCount(networks);

      if (!!ipCount && ipCount > 0) {
        if (ipCount - existingNodes - control.value >= 0) {
          return null;
        }
        return {ipsMissing: true};
      }
    }

    return null;
  };
}
