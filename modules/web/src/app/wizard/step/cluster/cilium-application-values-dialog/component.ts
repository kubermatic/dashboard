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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ApplicationService} from '@core/services/application';
import * as y from 'js-yaml';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {finalize, takeUntil} from 'rxjs/operators';

export interface CiliumApplicationValuesDialogData {
  applicationValues?: string; // JSON encoded string
}

enum Controls {
  Values = 'values',
}

@Component({
  selector: 'km-cilium-application-values-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class CiliumApplicationValuesDialogComponent implements OnInit, OnDestroy {
  readonly Controls = Controls;

  valuesConfig = '';
  isValuesConfigValid = true;
  isLoadingDetails: boolean;

  private readonly _unsubscribe = new Subject<void>();
  private readonly _applicationName = 'cilium';

  constructor(
    public dialogRef: MatDialogRef<CiliumApplicationValuesDialogComponent>,
    private readonly _applicationService: ApplicationService,
    @Inject(MAT_DIALOG_DATA) private data: CiliumApplicationValuesDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.applicationValues) {
      this._initValuesConfig(this.data.applicationValues);
    } else {
      this._loadApplicationDefinitionDetails();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onValuesConfigValidityChanged(isValid: boolean): void {
    this.isValuesConfigValid = isValid;
  }

  onSave(): void {
    this.dialogRef.close(this._getEncodedConfig());
  }

  private _loadApplicationDefinitionDetails() {
    this.isLoadingDetails = true;
    this._applicationService
      .getApplicationDefinition(this._applicationName)
      .pipe(
        takeUntil(this._unsubscribe),
        finalize(() => (this.isLoadingDetails = false))
      )
      .subscribe({
        next: appDef => {
          this._initValuesConfig(appDef.spec.defaultValues);
        },
        error: _ => {},
      });
  }

  private _initValuesConfig(valuesConfig: string | object): void {
    this.valuesConfig = '';
    if (typeof valuesConfig === 'string') {
      try {
        valuesConfig = JSON.parse(valuesConfig);
      } catch (_) {
        this.valuesConfig = '';
      }
    }
    if (!_.isEmpty(valuesConfig)) {
      try {
        this.valuesConfig = y.dump(valuesConfig);
      } catch (e) {
        this.valuesConfig = '';
      }
    }
  }

  private _getEncodedConfig(): string {
    let raw = y.load(this.valuesConfig);
    raw = !_.isEmpty(raw) ? raw : {};

    return JSON.stringify(raw);
  }
}
