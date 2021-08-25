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

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {
  EtcdBackupConfig,
  EtcdBackupConfigCondition,
  EtcdBackupConfigSpec,
  EtcdBackupConfigStatus,
} from '@shared/entity/backup';
import {Cluster, ClusterType} from '@shared/entity/cluster';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {shareReplay, switchMapTo} from 'rxjs/operators';

const SNAPSHOTS_MOCK = [
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'True',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-2',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'False',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    deletionTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-8',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-snapshot-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
];

const AUTOMATIC_BACKUPS_MOCK = [
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'True',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-2',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'False',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      schedule: '5 4 * * *',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'True',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    deletionTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-8',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
  {
    id: 'test-1234-abcd',
    creationTimestamp: new Date(),
    name: 'some-crd-name',
    spec: {
      name: 'my-backup-3',
      cluster: {
        name: 'boring-leakey',
        id: 'test-1234-abcd',
        type: ClusterType.Kubernetes,
      } as Cluster,
    } as EtcdBackupConfigSpec,
    status: {
      conditions: [
        {
          Type: 'SchedulingActive',
          Status: 'Unknown',
        } as EtcdBackupConfigCondition,
      ],
    } as EtcdBackupConfigStatus,
  } as EtcdBackupConfig,
];

@Injectable()
export class BackupService {
  private readonly _refreshTime = 10; // in seconds
  private _newRestRoot: string = environment.newRestRoot;
  private _headers: HttpHeaders = new HttpHeaders();
  private _automaticBackups$ = new Map<string, Observable<EtcdBackupConfig[]>>();
  private _snapshots$ = new Map<string, Observable<EtcdBackupConfig[]>>();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);

  readonly onAutomaticBackupsUpdate = new Subject<void>();
  readonly onSnapshotsUpdate = new Subject<void>();

  constructor(private readonly _appConfig: AppConfigService, private readonly _http: HttpClient) {} // private readonly _appConfig: AppConfigService // private readonly _http: HttpClient, // private readonly _matDialog: MatDialog,

  list(projectID: string, isSnapshot = false): Observable<EtcdBackupConfig[]> {
    if (isSnapshot) {
      return this._listSnapshots(projectID);
    }

    return this._listAutomaticBackups(projectID);
  }

  get(projectID: string, backupName: string, isSnapshot = false): Observable<EtcdBackupConfig> {
    if (isSnapshot) {
      return this._getSnapshot(projectID, backupName);
    }

    return this._getAutomaticBackup(projectID, backupName);
  }

  refreshAutomaticBackups(): void {
    this.onAutomaticBackupsUpdate.next();
    this._automaticBackups$.clear();
  }

  refreshSnapshots(): void {
    this.onSnapshotsUpdate.next();
    this._snapshots$.clear();
  }

  delete(projectID: string, name: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/etcdbackupconfig/${name}`;
    return this._http.delete(url, {headers: this._headers});
  }

  create(projectID: string, backup: EtcdBackupConfig): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/etcdbackupconfig`;
    return this._http.post(url, backup);
  }

  private _listAutomaticBackups(projectID: string): Observable<EtcdBackupConfig[]> {
    if (!this._automaticBackups$.get(projectID)) {
      const backups$: Observable<EtcdBackupConfig[]> = merge(this.onAutomaticBackupsUpdate, this._refreshTimer$)
        .pipe(switchMapTo(this._getAutomaticBackups(projectID)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._automaticBackups$.set(projectID, backups$);
    }

    return this._automaticBackups$.get(projectID);
  }

  private _listSnapshots(projectID: string): Observable<EtcdBackupConfig[]> {
    if (!this._snapshots$.get(projectID)) {
      const backups$: Observable<EtcdBackupConfig[]> = merge(this.onSnapshotsUpdate, this._refreshTimer$)
        .pipe(switchMapTo(this._getSnapshots(projectID)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._snapshots$.set(projectID, backups$);
    }

    return this._snapshots$.get(projectID);
  }

  private _getAutomaticBackups(_: string): Observable<EtcdBackupConfig[]> {
    // const url = `${this._newRestRoot}/projects/${projectID}/etcdconfigbackups`;
    return of(AUTOMATIC_BACKUPS_MOCK);

    // return this._http
    //   .get<EtcdBackupConfig[]>(url)
    //   .pipe(catchError(() => of<EtcdBackupConfig[]>([])));
  }

  private _getSnapshots(_: string): Observable<EtcdBackupConfig[]> {
    // const url = `${this._newRestRoot}/projects/${projectID}/etcdconfigbackups`;
    return of(SNAPSHOTS_MOCK);

    // return this._http
    //   .get<EtcdBackupConfig[]>(url)
    //   .pipe(catchError(() => of<EtcdBackupConfig[]>([])));
  }

  private _getAutomaticBackup(_projectID: string, _backupName: string): Observable<EtcdBackupConfig> {
    return of(AUTOMATIC_BACKUPS_MOCK[6]);
  }

  private _getSnapshot(_projectID: string, _backupName: string): Observable<EtcdBackupConfig> {
    return of(SNAPSHOTS_MOCK[0]);
  }
}
