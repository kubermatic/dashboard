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

import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';

@Component({
  selector: 'km-cidr-form',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CIDRFormComponent),
      multi: true,
    },
  ],
})
export class CIDRFormComponent implements OnInit {
  @Input() title = '';
  @Input() cidrs: string[] = [];
  @Output() cidrsChange = new EventEmitter<string[]>();
  form: FormGroup;

  constructor(private readonly _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({cidrs: this._formBuilder.array([])});
    this.cidrs.forEach(cidr => this._add(cidr));
    this._add();
  }

  get controlsArray(): FormArray {
    return this.form.get('cidrs') as FormArray;
  }

  private _add(cidr = ''): void {
    this.controlsArray.push(
      this._formBuilder.control(cidr, [Validators.pattern(/^((\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2]))$/)])
    );
  }

  private _update(): void {
    this.cidrs = this.controlsArray.getRawValue().filter(v => !!v);
    this.cidrsChange.emit(this.cidrs);
  }

  isRemovable(index: number): boolean {
    return index < this.controlsArray.length - 1;
  }

  delete(index: number): void {
    this.controlsArray.removeAt(index);
    this._update();
  }

  check(): void {
    this._addLabelIfNeeded();
    this._update();
  }

  private _addLabelIfNeeded(): void {
    const lastLabel = this.controlsArray.at(this.controlsArray.length - 1);
    if (lastLabel.value) {
      this._add();
    }
  }
}
