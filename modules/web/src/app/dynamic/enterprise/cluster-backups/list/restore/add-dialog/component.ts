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
import {RBACService} from '@app/core/services/rbac';
import {ClusterBackup, ClusterRestore} from '@app/shared/entity/backup';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {Observable, Subject, takeUntil} from 'rxjs';

export interface AddRestoreDialogConfig {
  backup: ClusterBackup;
  projectID: string;
}

enum Controls {
  Name = 'name',
  NameSpaces = 'namespaces',
  AllNamespaces = 'allNamespaces',
}

enum NamespacesState {
  Ready = 'Namespaces',
  Loading = 'Loading...',
  Empty = 'No Namespaces Available',
}

@Component({
  selector: 'km-add-restore-dialog',
  templateUrl: './template.html',
})
export class AddRestoreDialogComponent implements OnInit {
  private readonly _unsubscribe = new Subject<void>();
  projectID = this._config.projectID;
  backup = this._config.backup;
  nameSpaces: string[] = [];
  form: FormGroup;
  controls = Controls;
  namespacesLabel = NamespacesState.Ready;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: AddRestoreDialogConfig,
    private readonly _dialogRef: MatDialogRef<AddRestoreDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _rbacService: RBACService,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.AllNamespaces]: this._builder.control(true),
      [Controls.NameSpaces]: this._builder.control([]),
    });

    if (this.backup.spec.includedNamespaces?.length) {
      this.nameSpaces = this.backup.spec.includedNamespaces;
    } else {
      this.getClusterNamespaces(this.projectID, this.backup.spec.clusterid);
    }

    this.form
      .get(Controls.AllNamespaces)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const namespacesControl = this.form.get(Controls.NameSpaces);
        if (value) {
          namespacesControl.clearValidators();
        } else {
          namespacesControl.setValidators(Validators.required);
        }
        namespacesControl.updateValueAndValidity();
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

  getClusterNamespaces(projectID: string, clusterID: string): void {
    this.namespacesLabel = NamespacesState.Loading;
    this._rbacService
      .getClusterNamespaces(projectID, clusterID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(namespaces => {
        this.nameSpaces = namespaces;
        this.namespacesLabel = namespaces.length ? NamespacesState.Ready : NamespacesState.Empty;
      });
  }

  private _getClusterRestoreConfig(): ClusterRestore {
    const restore: ClusterRestore = {
      name: this.form.controls[Controls.Name].value,
      spec: {
        backupName: this.backup.name,
      },
    };

    if (this.form.get(Controls.AllNamespaces).value) {
      delete restore.spec.includedNamespaces;
    } else {
      restore.spec.includedNamespaces = this.form.get(Controls.NameSpaces).value;
    }

    return restore;
  }
}
