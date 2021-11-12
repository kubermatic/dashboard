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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {takeUntil} from 'rxjs/operators';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {ClusterFromTemplateDialogComponent} from '@shared/components/cluster-from-template/component';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {AutocompleteControls} from '@shared/components/autocomplete/component';

class SelectClusterTemplateDialogData {
  projectID: string;
}

enum Control {
  ClusterTemplate = 'clusterTemplate',
}

@Component({
  selector: 'km-select-cluster-template-dialog',
  templateUrl: './template.html',
})
export class SelectClusterTemplateDialogComponent implements OnInit, OnDestroy {
  control = Control;
  templates: ClusterTemplate[] = [];
  templateNames: string[] = [];
  isLoadingTemplates = true;
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SelectClusterTemplateDialogData,
    public dialogRef: MatDialogRef<SelectClusterTemplateDialogComponent>,
    private _matDialog: MatDialog,
    private readonly _clusterTemplateService: ClusterTemplateService
  ) {}

  ngOnInit() {
    this.form = new FormGroup({[Control.ClusterTemplate]: new FormControl('', [Validators.required])});

    this._clusterTemplateService
      .list(this.data.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.templates = templates;
        this.templateNames = templates.map(t => t.name);
        this.isLoadingTemplates = false;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get disabled(): boolean {
    return (
      !this.form.valid ||
      !this.templateNames.includes(this.form.get(Control.ClusterTemplate).value[AutocompleteControls.Main])
    );
  }

  create(): void {
    const templateName = this.form.get(Control.ClusterTemplate).value[AutocompleteControls.Main];
    const dialogConfig: MatDialogConfig = {
      data: {
        template: this.templates.find(t => t.name === templateName),
        projectID: this.data.projectID,
      },
    };

    this._matDialog.open(ClusterFromTemplateDialogComponent, dialogConfig);
    this.dialogRef.close();
  }
}
