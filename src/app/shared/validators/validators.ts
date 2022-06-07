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

import {ValidatorFn} from '@angular/forms';
import {ChipPatternValidator} from '@shared/validators/chip.pattern.validator';
import {LargerThanValidator} from '@shared/validators/larger-than.validator';
import {UniqueValidator} from '@shared/validators/unique.validator';
import {CronExpressionValidator} from './cron.validator';

export class KmValidators {
  static largerThan(min: number, inclusive = false): ValidatorFn {
    const validator = new LargerThanValidator(min, inclusive);
    return validator.validate.bind(validator);
  }

  static unique(): ValidatorFn {
    const validator = new UniqueValidator();
    return validator.validate.bind(validator);
  }

  static chipPattern(pattern: string): ValidatorFn {
    const validator = new ChipPatternValidator(pattern);
    return validator.validate.bind(validator);
  }

  static cronExpression(): ValidatorFn {
    const validator = new CronExpressionValidator();
    return validator.validate.bind(validator);
  }
}
