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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {ThemeInformerService} from '../../../core/services/theme-informer/theme-informer.service';
import {AddExternalClusterModel} from '../../../shared/model/AddExternalClusterModel';

export enum Controls {
  Name = 'name',
}

@Component({
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddExternalClusterDialogComponent implements OnInit, OnDestroy {
  controls = Controls;
  form: FormGroup;
  providerConfig = '';
  editorOptions: any = {
    contextmenu: false,
    language: 'yaml',
    lineNumbersMinChars: 4,
    minimap: {
      enabled: false,
    },
    scrollbar: {
      verticalScrollbarSize: 10,
      useShadows: false,
    },
    scrollBeyondLastLine: false,
  };
  private _unsubscribe = new Subject<void>();

  constructor(
    public _matDialogRef: MatDialogRef<AddExternalClusterDialogComponent>,
    private readonly _themeInformerService: ThemeInformerService
  ) {}

  ngOnInit(): void {
    this.editorOptions.theme = this._themeInformerService.isCurrentThemeDark ? 'vs-dark' : 'vs';

    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  save(): void {
    const datacenter: AddExternalClusterModel = {
      name: this.form.get(Controls.Name).value,
      kubeconfig: this.providerConfig,
    };

    this._matDialogRef.close(datacenter);
  }
}
