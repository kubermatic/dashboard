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

import {Component, Input} from '@angular/core';
import {Addon} from '@shared/entity/addon';
import {Cluster} from '@shared/entity/cluster';
import {AlertmanagerConfig, RuleGroup} from '@shared/entity/mla';
import _ from 'lodash';

@Component({
  selector: 'km-mla',
  templateUrl: './template.html',
  standalone: false,
})
export class MLAComponent {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() alertmanagerConfig: AlertmanagerConfig;
  @Input() ruleGroups: RuleGroup[];
  @Input() addons: Addon[];
}
