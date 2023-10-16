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

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterService} from '@app/core/services/cluster';
import {Cluster} from '@app/shared/entity/cluster';
import {CookieService} from 'ngx-cookie-service';
import {Subject, takeUntil} from 'rxjs';

enum Controls {
  Name = 'name',
  Clusters = 'clusters',
  NameSpaces = 'namespaces',
}

@Component({
  selector: 'km-add-dialog',
  templateUrl: './template.html',
})
export class AddRestoreDialogComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  data: any;
  form: FormGroup;
  controls = Controls;
  clusters: Cluster[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddRestoreDialogComponent,
    private readonly _dialogRef: MatDialogRef<AddRestoreDialogComponent>,
    private readonly _builder: FormBuilder,
    readonly _cookieService: CookieService,
    private readonly _clusterService: ClusterService
  ) {}

  ngOnInit(): void {
    this.data = this._config;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Clusters]: this._builder.control('', Validators.required),
      [Controls.NameSpaces]: this._builder.control('', Validators.required),
    });

    this._clusterService
      .clusters(this.data.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  createRestore(): void {
    const restore = {
      name: this.form.controls[Controls.Name].value,
      namespaces: this.form.controls[Controls.NameSpaces].value,
      clusterName: this.form.controls[Controls.Clusters].value,
      backupName: this.data.backup.name,
      restored: `${this.form.controls[Controls.NameSpaces].value.length}/${this.data.backup.namespaces.length}`,
      created: new Date().toISOString(),
    };
    const restores = JSON.parse(this._cookieService.get('restore') || '[]');
    restores.push(restore);
    this._cookieService.set('restore', JSON.stringify(restores));
    this._dialogRef.close(true);
  }
}
