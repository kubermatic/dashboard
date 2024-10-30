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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {BackupCredentials, EtcdBackupConfig, EtcdRestore} from '@shared/entity/backup';
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, shareReplay, switchMapTo} from 'rxjs/operators';

enum Type {
  AutomaticBackup = 'automatic',
  Snapshot = 'snapshot',
}

@Injectable()
export class BackupService {
  private readonly _refreshTime = 10;
  private _restRoot: string = environment.restRoot;
  private _newRestRoot: string = environment.newRestRoot;
  private _headers: HttpHeaders = new HttpHeaders();
  private _automaticBackups$ = new Map<string, Observable<EtcdBackupConfig[]>>();
  private _snapshots$ = new Map<string, Observable<EtcdBackupConfig[]>>();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);
  readonly onAutomaticBackupsUpdate = new Subject<void>();
  readonly onSnapshotsUpdate = new Subject<void>();

  constructor(
    private readonly _appConfig: AppConfigService,
    private readonly _http: HttpClient
  ) {}

  list(projectID: string, isSnapshot = false): Observable<EtcdBackupConfig[]> {
    if (isSnapshot) {
      return this._listSnapshots(projectID);
    }

    return this._listAutomaticBackups(projectID);
  }

  get(projectID: string, clusterID: string, backupID: string): Observable<EtcdBackupConfig> {
    return this._getBackup(projectID, clusterID, backupID);
  }

  refreshAutomaticBackups(): void {
    this.onAutomaticBackupsUpdate.next();
    this._automaticBackups$.clear();
  }

  refreshSnapshots(): void {
    this.onSnapshotsUpdate.next();
    this._snapshots$.clear();
  }

  delete(projectID: string, clusterID: string, backupID: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/etcdbackupconfigs/${backupID}`;
    return this._http.delete<void>(url, {headers: this._headers});
  }

  create(projectID: string, clusterID: string, backup: EtcdBackupConfig): Observable<EtcdBackupConfig> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/etcdbackupconfigs`;
    return this._http.post<EtcdBackupConfig>(url, backup);
  }

  restore(projectID: string, clusterID: string, restore: EtcdRestore): Observable<EtcdBackupConfig> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/etcdrestores`;
    return this._http.post<EtcdBackupConfig>(url, restore);
  }

  restoreList(projectID: string): Observable<EtcdRestore[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/etcdrestores`;
    return this._http.get<EtcdRestore[]>(url);
  }

  restoreDelete(projectID: string, clusterID: string, name: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/etcdrestores/${name}`;
    return this._http.delete<void>(url, {headers: this._headers});
  }

  enable(projectID: string, clusterID: string, enable: boolean): Observable<EtcdBackupConfig> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/etcdbackupconfigs`;
    return this._http.post<EtcdBackupConfig>(url, {enable});
  }

  updateBackupCredentials(seedName: string, credentials: BackupCredentials): Observable<void> {
    const url = `${this._newRestRoot}/seeds/${seedName}/backupcredentials`;
    return this._http.put<void>(url, credentials);
  }

  getDestinations(projectID: string, clusterID: string): Observable<string[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/backupdestinations`;
    return this._http.get<string[]>(url);
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

  private _getAutomaticBackups(projectID: string): Observable<EtcdBackupConfig[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/etcdbackupconfigs?type=${Type.AutomaticBackup}`;
    return this._http.get<EtcdBackupConfig[]>(url).pipe(catchError(() => of<EtcdBackupConfig[]>([])));
  }

  private _getSnapshots(projectID: string): Observable<EtcdBackupConfig[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/etcdbackupconfigs?type=${Type.Snapshot}`;
    return this._http.get<EtcdBackupConfig[]>(url).pipe(catchError(() => of<EtcdBackupConfig[]>([])));
  }

  private _getBackup(projectID: string, clusterID: string, backupName: string): Observable<EtcdBackupConfig> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/etcdbackupconfigs/${backupName}`;
    return this._http.get<EtcdBackupConfig>(url, {headers: this._headers});
  }

  deleteBackupDestination(seed: string, destination: string): Observable<void> {
    const url = `${this._restRoot}/admin/seeds/${seed}/backupdestinations/${destination}`;
    return this._http.delete<void>(url);
  }
}
