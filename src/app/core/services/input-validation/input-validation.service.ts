import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

@Injectable()
export class InputValidationService {

  constructor() { }

  public isValid(formControl: FormControl): boolean {
    return !formControl.valid && formControl.touched;
  }
}
