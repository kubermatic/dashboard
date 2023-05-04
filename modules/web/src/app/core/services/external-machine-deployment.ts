// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, switchMap, take} from 'rxjs/operators';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {environment} from '@environments/environment';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {ExternalMachineDeployment, ExternalMachineDeploymentPatch} from '@shared/entity/external-machine-deployment';
import {MasterVersion} from '@shared/entity/cluster';
import {ExternalAddMachineDeploymentDialogComponent} from '@app/cluster/details/external-cluster/external-cluster-add-machine-deployment/component';
import {AKSNodePoolVersionForMachineDeployments, AKSVMSize} from '@app/shared/entity/provider/aks';
import {GCPDiskType, GCPMachineSize} from '@app/shared/entity/provider/gcp';
import {EKSNodeRole, EKSSubnet} from '@shared/entity/provider/eks';
import {EKSInstanceType} from '@app/shared/entity/provider/eks';

@Injectable()
export class ExternalMachineDeploymentService {
  private readonly _newRestRoot: string = environment.newRestRoot;
  private readonly _restRoot: string = environment.newRestRoot;
  private _externalMachineDeployment: ExternalMachineDeployment = ExternalMachineDeployment.NewEmptyMachineDeployment();
  private _isAddMachineDeploymentFormValid = false;

  constructor(
    private readonly _httpClient: HttpClient,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  get externalMachineDeployment(): ExternalMachineDeployment {
    return this._externalMachineDeployment;
  }

  set externalMachineDeployment(externalMachineDeployment: ExternalMachineDeployment) {
    this._externalMachineDeployment = externalMachineDeployment;
  }

  get isAddMachineDeploymentFormValid(): boolean {
    return this._isAddMachineDeploymentFormValid;
  }

  set isAddMachineDeploymentFormValid(valid: boolean) {
    this._isAddMachineDeploymentFormValid = valid;
  }

  getEKSSubnetsForMachineDeployment(projectID: string, clusterID: string, vpcId: string): Observable<EKSSubnet[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/eks/subnets`;
    return this._httpClient.get<EKSSubnet[]>(url, {headers: {VpcId: vpcId}}).pipe(catchError(() => of<[]>()));
  }

  getEKSNodeRoleForMachineDeployment(projectID: string, clusterID: string): Observable<EKSNodeRole[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/eks/noderoles`;
    return this._httpClient.get<EKSNodeRole[]>(url).pipe(catchError(() => of([])));
  }

  getEKSInstanceTypesForMachineDeployment(
    projectID: string,
    clusterID: string,
    architecture?: string
  ): Observable<EKSInstanceType[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/eks/instancetypes?architecture=${architecture}`;
    return this._httpClient.get<EKSInstanceType[]>(url).pipe(catchError(() => of<[]>([])));
  }

  getAKSVmSizesForMachineDeployment(projectID: string, clusterID: string, location: string): Observable<AKSVMSize[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/aks/vmsizes`;
    return this._httpClient.get<AKSVMSize[]>(url, {headers: {Location: location}}).pipe(catchError(() => of<[]>()));
  }

  getAKSAvailableNodePoolVersionsForMachineDeployment(
    projectID: string,
    clusterID: string
  ): Observable<AKSNodePoolVersionForMachineDeployments[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/aks/versions`;
    return this._httpClient.get<AKSNodePoolVersionForMachineDeployments[]>(url).pipe(catchError(() => of<[]>()));
  }

  getGKEDiskTypesForMachineDeployment(projectID: string, clusterID: string): Observable<GCPDiskType[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/gke/disktypes`;
    return this._httpClient.get<GCPDiskType[]>(url).pipe(catchError(() => of<[]>()));
  }

  getGKEMachineTypesForMachineDeployment(projectID: string, clusterID: string): Observable<GCPMachineSize[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/providers/gke/sizes`;
    return this._httpClient.get<GCPMachineSize[]>(url).pipe(catchError(() => of<[]>()));
  }

  machineDeploymentUpgrades(
    projectID: string,
    clusterID: string,
    machineDeploymentId: string
  ): Observable<MasterVersion[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/machinedeployments/${machineDeploymentId}/upgrades`;
    return this._httpClient.get<MasterVersion[]>(url).pipe(catchError(() => of<MasterVersion[]>([])));
  }

  patchExternalMachineDeployment(
    projectID: string,
    clusterID: string,
    machineDeploymentID: string,
    patch: ExternalMachineDeploymentPatch
  ): Observable<ExternalMachineDeployment> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/machinedeployments/${machineDeploymentID}`;
    return this._httpClient.patch<ExternalMachineDeployment>(url, patch);
  }

  showCreateExternalClusterMachineDeploymentDialog(
    projectID: string,
    cluster: ExternalCluster
  ): Observable<ExternalMachineDeployment> {
    const dialogConfig: MatDialogConfig = {
      data: {
        projectId: projectID,
        clusterData: cluster,
      },
    };
    const dialogRef = this._matDialog.open(ExternalAddMachineDeploymentDialogComponent, dialogConfig);
    return dialogRef
      .afterClosed()
      .pipe(filter(data => !!data))
      .pipe(
        switchMap((data: ExternalMachineDeployment) => {
          return this.createExternalMachineDeployment(projectID, cluster.id, data);
        })
      );
  }

  showExternalMachineDeploymentDeleteDialog(
    projectID: string,
    cluster: ExternalCluster,
    md: ExternalMachineDeployment
  ): Observable<boolean> {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: `Delete ${cluster?.cloud.eks ? 'Node Group' : 'Node Pool'}`,
        message: `Delete <b>${md.name}</b> of <b>${cluster.name}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };
    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    return dialogRef.afterClosed().pipe(
      mergeMap((isConfirmed: boolean): Observable<boolean> => {
        if (isConfirmed) {
          return this._deleteExternalMachineDeployment(projectID, cluster.id, md.id).pipe(
            map(data => {
              this._notificationService.success(`Deleting the ${md.name} machine deployment`);
              return Boolean(data);
            }),
            catchError(() => {
              this._notificationService.error(`Could not delete the ${md.name} machine deployment`);
              return of(false);
            }),
            take(1)
          );
        }
        return of(false);
      })
    );
  }

  createExternalMachineDeployment(
    projectID: string,
    clusterID: string,
    md: ExternalMachineDeployment
  ): Observable<ExternalMachineDeployment> {
    const url = `${this._restRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}/machinedeployments`;
    return this._httpClient
      .post<ExternalMachineDeployment>(url, md)
      .pipe(catchError(() => of<ExternalMachineDeployment>()));
  }

  private _deleteExternalMachineDeployment(
    projectID: string,
    clusterId: string,
    machineDeploymentId: string
  ): Observable<Record<string, never>> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterId}/machinedeployments/${machineDeploymentId}`;
    return this._httpClient.delete<Record<string, never>>(url);
  }
}
