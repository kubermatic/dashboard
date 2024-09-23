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

import {AbstractControl, ValidationErrors, Validator} from '@angular/forms';
import {isValidCron} from 'cron-validator';

export class CronExpressionValidator implements Validator {
  private allowedCronExpressions: string[] = [
    '@yearly',
    '@annually',
    '@monthly',
    '@weekly',
    '@daily',
    '@midnight',
    '@hourly',
  ];
  private everyExpressionPrefix = '@every ';

  validate(control: AbstractControl): ValidationErrors | null {
    if (
      this.allowedCronExpressions.includes(control.value) ||
      control.value.startsWith(this.everyExpressionPrefix) ||
      !control.value
    ) {
      return null;
    }

    const isValid = isValidCron(control.value, {alias: true});
    return isValid ? null : this._error();
  }

  private _error(): ValidationErrors {
    return {
      cronExpression: {
        valid: false,
      },
    };
  }
}
