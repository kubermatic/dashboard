//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2025 Kubermatic GmbH
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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ClusterService} from '@core/services/cluster';
import {ClusterBackupService} from '@core/services/cluster-backup';
import {NotificationService} from '@core/services/notification';
import {BackupStorageLocation} from '@shared/entity/backup';
import {Cluster, CreateClusterBackupStorageLocation} from '@shared/entity/cluster';
import {CBSL_SYNC_PERIOD} from '@shared/validators/others';
import {Observable, Subject} from 'rxjs';
import {finalize, take, takeUntil} from 'rxjs/operators';

export interface ImportBackupDialogConfig {
  projectID: string;
  cluster: Cluster;
}

interface S3DirectoryTreeNode {
  name: string;
  path: string;
  children?: S3DirectoryTreeNode[];
}

enum BSLListState {
  Ready = 'Backup Storage Location',
  Loading = 'Loading...',
  Empty = 'No Backup Storage Locations Available',
}

enum Controls {
  BSL = 'bsl',
  BackupPath = 'backupPath',
  BackupSyncPeriod = 'backupSyncPeriod',
}

@Component({
    selector: 'km-import-backup-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class ImportBackupDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Controls = Controls;
  projectID = this._config.projectID;
  cluster = this._config.cluster;
  form: FormGroup;
  backupStorageLocations: BackupStorageLocation[];
  backupStorageLocationLabel: BSLListState = BSLListState.Ready;
  selectedBSL: BackupStorageLocation;
  s3DirectoriesDataSource: S3DirectoryTreeNode[] = [];
  selectedNode: S3DirectoryTreeNode;
  isLoadingBackups = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly _config: ImportBackupDialogConfig,
    private readonly _dialogRef: MatDialogRef<ImportBackupDialogComponent>,
    private readonly _builder: FormBuilder,
    private readonly _clusterBackupService: ClusterBackupService,
    private readonly _clusterService: ClusterService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.BSL]: this._builder.control('', Validators.required),
      [Controls.BackupPath]: this._builder.control('', Validators.required),
      [Controls.BackupSyncPeriod]: this._builder.control('0', CBSL_SYNC_PERIOD),
    });

    this._getCBSL(this._config.projectID);

    this.form
      .get(Controls.BSL)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        this.onSelectNode(null);
        this.selectedBSL = this.backupStorageLocations.find(bsl => bsl.name === value);
        this.form.get(Controls.BackupSyncPeriod).setValue(this.selectedBSL.spec.backupSyncPeriod);
        this._initS3Explorer(this.selectedBSL);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  childrenAccessor(node: S3DirectoryTreeNode) {
    return node.children ?? [];
  }

  hasChild(_: number, node: S3DirectoryTreeNode) {
    return !!node.children && node.children.length > 0;
  }

  onSelectNode(node: S3DirectoryTreeNode) {
    this.selectedNode = node;
    this.form.get(Controls.BackupPath).setValue(node?.path || '');
  }

  getObservable(): Observable<void> {
    return this._clusterService.createBSL(this.projectID, this.cluster.id, this._getClusterBSL());
  }

  onNext(): void {
    this._notificationService.success(
      `New backup storage location created successfully in ${this.cluster.name} cluster.`
    );
    this._dialogRef.close(true);
  }

  private _getCBSL(projectID: string): void {
    this.backupStorageLocationLabel = BSLListState.Loading;
    this._clusterBackupService
      .listBackupStorageLocation(projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(cbslList => {
        this.backupStorageLocations = cbslList;
        this.backupStorageLocationLabel = cbslList.length ? BSLListState.Ready : BSLListState.Empty;
      });
  }

  private _initS3Explorer(bsl: BackupStorageLocation) {
    this.s3DirectoriesDataSource = [];
    this.isLoadingBackups = true;
    this._clusterBackupService
      .getBackupStorageLocationBucketObjects(this.projectID, bsl.name)
      .pipe(take(1))
      .pipe(finalize(() => (this.isLoadingBackups = false)))
      .subscribe(objects => {
        const paths = objects.map(object => object.key);
        this.s3DirectoriesDataSource = this._buildS3DirectoryTree(paths);
      });
  }

  private _buildS3DirectoryTree(paths: string[]): S3DirectoryTreeNode[] {
    const rootMap = new Map<string, S3DirectoryTreeNode>();

    paths.forEach(path => {
      const parts = path.split('/');
      this._insertTreePath(rootMap, parts);
    });

    return Array.from(rootMap.values());
  }

  private _insertTreePath(map: Map<string, S3DirectoryTreeNode>, parts: string[], parentPath: string = ''): void {
    if (parts.length === 0) return;

    const [currentPart, ...remainingParts] = parts;

    let node = map.get(currentPart);
    if (!node) {
      node = {name: currentPart, path: `${parentPath}/${currentPart}`};
      map.set(currentPart, node);
    }

    if (remainingParts.length > 0) {
      if (!node.children) {
        node.children = [];
      }

      // Use a Map to manage children for faster lookups
      const childMap = new Map<string, S3DirectoryTreeNode>(node.children.map(child => [child.name, child]));
      this._insertTreePath(childMap, remainingParts, node.path);

      // Update children with the new structure from the Map
      node.children = Array.from(childMap.values());
    }
  }

  private _getClusterBSL(): CreateClusterBackupStorageLocation {
    if (this.selectedBSL) {
      return {
        cbslName: this.selectedBSL.name,
        bslSpec: {
          ...this.selectedBSL.spec,
          backupSyncPeriod: this.form.get(Controls.BackupSyncPeriod).value || this.selectedBSL.spec.backupSyncPeriod,
          objectStorage: {
            ...this.selectedBSL.spec.objectStorage,
            prefix: this.form.get(Controls.BackupPath).value,
          },
        },
      };
    }
    return null;
  }
}
