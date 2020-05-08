import {
  AbstractControl,
  AsyncValidator,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

import {LabelService} from '../../core/services';
import {GlobalModule} from '../../core/services/global/global.module';
import {ResourceLabelMap, ResourceType} from '../entity/LabelsEntity';

export class RestrictedLabelKeyNameValidator implements AsyncValidator {
  private readonly _labelService: LabelService;

  constructor(private readonly _resourceType: ResourceType) {
    this._labelService = GlobalModule.injector.get(LabelService);
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const value = control.value.toString();
    return this._labelService.systemLabels.pipe(
      map((labels: ResourceLabelMap) => {
        const isRestricted = labels[this._resourceType].find(
          label => label === value
        );

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
