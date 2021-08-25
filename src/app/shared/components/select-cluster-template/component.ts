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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {takeUntil} from 'rxjs/operators';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {ClusterFromTemplateDialogComponent} from '@shared/components/cluster-from-template/component';

enum Control {
  ClusterTemplate = 'clusterTemplate',
}

@Component({
  selector: 'km-select-cluster-template-dialog',
  templateUrl: './template.html',
})
export class SelectClusterTemplateDialogComponent implements OnInit, OnDestroy {
  control = Control;
  @Input() projectID: string;
  templates: ClusterTemplate[] = [];
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<SelectClusterTemplateDialogComponent>,
    private _matDialog: MatDialog,
    private readonly _clusterTemplateService: ClusterTemplateService
  ) {}

  ngOnInit() {
    this.form = new FormGroup({[Control.ClusterTemplate]: new FormControl('', [Validators.required])});

    this._clusterTemplateService
      .list(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(ct => (this.templates = ct));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  create(): void {
    const dialog = this._matDialog.open(ClusterFromTemplateDialogComponent);
    dialog.componentInstance.projectID = this.projectID;
    dialog.componentInstance.template = this.form.get(Control.ClusterTemplate).value;
    this.dialogRef.close();
  }
}
