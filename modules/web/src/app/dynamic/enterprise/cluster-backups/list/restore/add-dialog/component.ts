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
import {ClusterBackupService} from '@app/core/services/cluster-backup';
import {NotificationService} from '@app/core/services/notification';
import {ClusterBackup, ClusterRestore} from '@app/shared/entity/backup';
import {Cluster} from '@app/shared/entity/cluster';
import {CookieService} from 'ngx-cookie-service';
import {Observable, Subject} from 'rxjs';

export interface AddRestoreDialogConfig {
  backup: ClusterBackup;
  projectID: string;
}

enum Controls {
  Name = 'name',
  NameSpaces = 'namespaces',
}

@Component({
  selector: 'km-add-restore-dialog',
  templateUrl: './template.html',
})
export class AddRestoreDialogComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  projectID = this._config.projectID;
  backup = this._config.backup;
  form: FormGroup;
  controls = Controls;
  clusters: Cluster[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddRestoreDialogConfig,
    private readonly _dialogRef: MatDialogRef<AddRestoreDialogComponent>,
    private readonly _builder: FormBuilder,
    readonly _cookieService: CookieService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.NameSpaces]: this._builder.control('', Validators.required),
    });
  }

  getObservable(): Observable<ClusterRestore> {
    return this._clusterBackupService.createRestore(
      this.projectID,
      this.backup.spec.clusterid,
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
        backupName: this.backup.name,
      },
    };
    return restore;
  }
}
