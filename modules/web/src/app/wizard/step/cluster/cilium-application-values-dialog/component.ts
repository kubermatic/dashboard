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
import * as y from 'js-yaml';
import _ from 'lodash';
import {Subject} from 'rxjs';

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

  constructor(
    public dialogRef: MatDialogRef<CiliumApplicationValuesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: CiliumApplicationValuesDialogData
  ) {}

  ngOnInit(): void {
    this._initValuesConfig(this.data.applicationValues);
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

  /**
   * Initializes the values for editor
   * @param valuesConfig JSON encoded string
   * @private
   */
  private _initValuesConfig(valuesConfig: string): void {
    this.valuesConfig = '';
    if (!_.isEmpty(valuesConfig)) {
      try {
        this.valuesConfig = y.dump(JSON.parse(valuesConfig));
      } catch (_) {
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
