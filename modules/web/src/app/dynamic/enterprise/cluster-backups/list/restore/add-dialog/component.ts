//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterService} from '@app/core/services/cluster';
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {ClusterRestore} from '@app/shared/entity/backup';
import {Cluster} from '@app/shared/entity/cluster';
import {CookieService} from 'ngx-cookie-service';
import {Observable, Subject, takeUntil} from 'rxjs';

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
    private readonly _clusterService: ClusterService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.data = this._config;
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      // [Controls.Clusters]: this._builder.control(this.data.backup.spec.clusterid, Validators.required),
      [Controls.NameSpaces]: this._builder.control('', Validators.required),
    });

    this._clusterService
      .clusters(this.data.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => (this.clusters = clusters));
  }

  getObservable(): Observable<ClusterRestore> {
    return this._clusterBackupService.createRestore(
      this.data.projectID,
      this.data.backup.spec.clusterid,
      this._getClusterRestoreConfig()
    );
  }

  onNext(restore: ClusterRestore): void {
    this._dialogRef.close(true);
    this._notificationService.success(`Restoring the ${restore.name}`);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getClusterRestoreConfig(): ClusterRestore {
    const restore: ClusterRestore = {
      name: this.form.controls[Controls.Name].value,
      spec: {
        includedNamespaces: this.form.controls[Controls.NameSpaces].value,
        backupName: this.data.backup.name,
      },
    };
    return restore;
  }
}
