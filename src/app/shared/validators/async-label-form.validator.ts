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

import {AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {GlobalModule} from '@core/services/global/module';
import {LabelService} from '@core/services/label';
import {ResourceLabelMap, ResourceType} from '@shared/entity/common';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

export class RestrictedLabelKeyNameValidator implements AsyncValidator {
  private readonly _labelService: LabelService;

  constructor(private readonly _resourceType: ResourceType) {
    this._labelService = GlobalModule.injector.get(LabelService);
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const value = control.value.toString();
    return this._labelService.systemLabels.pipe(
      map((labels: ResourceLabelMap) => {
        const isRestricted = labels[this._resourceType].find(label => label === value);

        if (isRestricted) {
          return {labelKeyNameRestricted: true};
        }

        return null;
      }),
      catchError(() => of(null))
    );
  }
}

export class AsyncValidators {
  static RestrictedLabelKeyName(resourceType: ResourceType): AsyncValidatorFn {
    const validator = new RestrictedLabelKeyNameValidator(resourceType);
    return validator.validate.bind(validator);
  }
}
