import {AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {AppModule} from '../../app.module';
import {LabelService} from '../../core/services';
import {ResourceLabelMap, ResourceType} from '../entity/LabelsEntity';

export class RestrictedLabelKeyNameValidator implements AsyncValidator {
  private readonly _labelService: LabelService;

  constructor(private readonly _resourceType: ResourceType) {
    this._labelService = AppModule.injector.get(LabelService);
  }

  validate(control: AbstractControl): Promise<ValidationErrors|null>|Observable<ValidationErrors|null> {
    const value = control.value.toString();
    return this._labelService.systemLabels.pipe(
        map((labels: ResourceLabelMap) => {
          const isRestricted = labels[this._resourceType].find(label => label === value);

          if (isRestricted) {
            return {labelKeyNameRestricted: true};
          }

          return null;
        }),
        catchError(() => null));
  }
}

export class AsyncValidators {
  static RestrictedLabelKeyName(resourceType: ResourceType): AsyncValidatorFn {
    const validator = new RestrictedLabelKeyNameValidator(resourceType);
    return validator.validate.bind(validator);
  }
}
