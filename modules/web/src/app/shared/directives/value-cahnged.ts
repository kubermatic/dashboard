// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {NgControl} from '@angular/forms';

interface VlaueChangedDirectiveValues {
  isEditMode: boolean;
  elementType: string;
  elementPosition: string;
}

@Directive({
  selector: '[vlaueChanged]',
})
export class VlaueChangedDirective {
  private _previousValue: any;

  @Input() data: VlaueChangedDirectiveValues;

  constructor(private _el: ElementRef, private _control: NgControl) {}

  getValueObject(object: any): any {
    if (typeof object === 'object') {
      const firstValue = Object?.keys(object)[0];
      return this.getValueObject(object[firstValue]);
    }
    return object;
  }

  @HostListener('ngModelChange', ['$event'])
  onModelChange(event: any) {
    console.log(event,'fdfdf');
    console.log(!this._previousValue, 'PV');
    
    
    if (!this._previousValue) {
    console.log(this._control.control.value);
    

    //   this._previousValue = this.getValueObject(this._control.control.value);
    } else {
      if (this._previousValue !== this.getValueObject(event)) {
        const element = this._el.nativeElement;
        element.classList.add('value-changed');
        // element.style.setProperty('--value-height', '60%');
      } else {
        this._el.nativeElement.classList.remove('value-changed');
      }
    }
  }
}
