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

import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';

export enum Provider {
  Custom,
  AWS,
  Azure,
  GoogleCloud,
}

enum Step {
  Provider = 'Pick Provider',
  Credentials = 'Enter Credentials',
  Cluster = 'Pick Cluster',
}

@Component({
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddExternalClusterDialogComponent implements OnInit {
  @Input() projectId: string;

  steps: Step[] = [Step.Provider, Step.Credentials];
  selectedProvider: Provider;
  form: FormGroup;

  readonly step = Step;
  readonly provider = Provider;

  constructor(
    private readonly _matDialogRef: MatDialogRef<AddExternalClusterDialogComponent>,
    private readonly _formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    const controls = {};
    this.steps.forEach(step => (controls[step] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);
  }

  get creating(): boolean {
    return false;
  }

  get invalid(): boolean {
    return false;
  }

  isEnabled(step: Step): boolean {
    return this.steps.indexOf(step) > -1;
  }

  add(): void {
    this._matDialogRef.close();
  }
}
