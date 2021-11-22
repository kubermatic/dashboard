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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ExternalClusterModel} from '../../model/ExternalClusterModel';

export enum Controls {
  Name = 'name',
}

@Component({
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EditClusterConnectionDialogComponent implements OnInit {
  @Input() name = '';
  @Input() projectId: string;
  controls = Controls;
  form: FormGroup;
  kubeconfig = '';

  constructor(private readonly _matDialogRef: MatDialogRef<EditClusterConnectionDialogComponent>) {}

  ngOnInit(): void {
    this.form = new FormGroup({name: new FormControl(this.name, [Validators.required])});
  }

  handler(): void {
    const model: ExternalClusterModel = {
      name: this.form.get(Controls.Name).value,
      kubeconfig: btoa(this.kubeconfig),
    };

    this._matDialogRef.close(model);
  }
}
