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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ClusterBackup, ClusterBackupSchedule, ClusterRestore} from '@app/shared/entity/backup';
import {environment} from '@environments/environment';
import {Observable, catchError, of} from 'rxjs';

@Injectable()
export class ClusterBackupService {
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  listClusterBackups(projectID: string, clusterID: string): Observable<ClusterBackup[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbackup`;
    return this._http.get<ClusterBackup[]>(url).pipe(catchError(() => of<ClusterBackup[]>([])));
  }

  create(projectID: string, backup: ClusterBackup): Observable<ClusterBackup> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${backup.spec.clusterid}/clusterbackup`;

    return this._http.post<ClusterBackup>(url, backup).pipe(catchError(() => of<ClusterBackup>({} as ClusterBackup)));
  }

  delete(projectID: string, clusterID: string, backupName: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbackup/${backupName}`;
    return this._http.delete<void>(url).pipe(catchError(() => of<void>()));
  }

  listRestore(projectID: string, clusterID: string): Observable<ClusterRestore[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterrestore`;
    return this._http.get<ClusterRestore[]>(url).pipe(catchError(() => of<ClusterRestore[]>([])));
  }

  createRestore(projectID: string, clusterID: string, restore: ClusterRestore): Observable<ClusterRestore> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterrestore`;
    return this._http
      .post<ClusterRestore>(url, restore)
      .pipe(catchError(() => of<ClusterRestore>({} as ClusterRestore)));
  }

  deleteRestore(projectID: string, clusterID: string, restoreName: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterrestore/${restoreName}`;
    return this._http.delete<void>(url).pipe(catchError(() => of<void>()));
  }

  createSchedule(projectID: string, schedule: ClusterBackupSchedule): Observable<ClusterBackupSchedule> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${schedule.spec.template.clusterid}/clusterbackupschedule`;

    return this._http
      .post<ClusterBackupSchedule>(url, schedule)
      .pipe(catchError(() => of<ClusterBackupSchedule>({} as ClusterBackupSchedule)));
  }

  listClusterScheduleBackups(projectID: string, clusterID: string): Observable<ClusterBackup[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbackupschedule`;
    return this._http.get<ClusterBackup[]>(url).pipe(catchError(() => of<ClusterBackup[]>([])));
  }

  deleteSchedule(projectID: string, clusterID: string, scheduleName: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/clusterbackupschedule/${scheduleName}`;
    return this._http.delete<void>(url).pipe(catchError(() => of<void>()));
  }
}
