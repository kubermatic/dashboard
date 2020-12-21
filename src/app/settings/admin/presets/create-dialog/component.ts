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

import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatStepper} from '@angular/material/stepper';
import {Subject} from 'rxjs';

export interface CreatePresetDialogData {
  title: string;
}

export enum Controls {}

enum StepRegistry {
  Preset = 'Preset',
  Provider = 'Provider',
  Settings = 'Settings',
}

@Component({
  selector: 'km-create-preset-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class CreatePresetDialogComponent implements OnInit, OnDestroy {
  readonly controls = Controls;
  readonly stepRegistry = StepRegistry;
  form: FormGroup;
  creating = false;
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;
  private _unsubscribe = new Subject<void>();

  constructor(
    // private readonly _matDialogRef: MatDialogRef<CreatePresetDialogComponent>,
    private readonly _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: CreatePresetDialogData
  ) {}

  get steps(): {name: string}[] {
    return [{name: 'Preset'}, {name: 'Provider'}, {name: 'Settings'}];
  }

  get active(): {name: string} {
    return this.steps[this._stepper.selectedIndex];
  }

  get first(): boolean {
    return this._stepper.selectedIndex === 0;
  }

  get last(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get invalid(): boolean {
    return this.form.get(this.active.name).invalid;
  }

  ngOnInit(): void {
    const controls = {};
    this.steps.forEach(step => (controls[step.name] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  save(): void {}
}
