// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {RuleGroupName} from '@shared/entity/mla';
import {decode} from 'js-base64';
import {load} from 'js-yaml';
import * as _ from 'lodash';

export class MLAUtils {
  static getRuleGroupName(data: string): string {
    let ruleGroupName = new RuleGroupName();
    const yamlData = decode(data);
    const jsonData = load(yamlData) as RuleGroupName;
    if (!_.isEmpty(jsonData)) {
      ruleGroupName = jsonData;
    }
    return ruleGroupName.name ? ruleGroupName.name : '';
  }
}
