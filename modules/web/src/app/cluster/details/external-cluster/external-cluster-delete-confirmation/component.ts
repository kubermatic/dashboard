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

import {AfterContentChecked, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {NotificationService} from '@core/services/notification';
import {AdminSettings} from '@shared/entity/settings';
import {ClipboardService} from 'ngx-clipboard';
import {Observable, Subject} from 'rxjs';
import {finalize, take} from 'rxjs/operators';
import {DeleteExternalClusterAction, ExternalCluster, ExternalClusterProvider} from '@shared/entity/external-cluster';
import {ExternalClusterService} from '@core/services/external-cluster';
import {ClusterService} from '@core/services/cluster';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';

@Component({
  selector: 'km-external-cluster-delete-confirmation',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  standalone: false,
})
export class ExternalClusterDeleteConfirmationComponent implements OnInit, OnDestroy, AfterContentChecked {
  readonly Provider = ExternalClusterProvider;
  inputName = '';
  settings: AdminSettings;
  machineDeployments: ExternalMachineDeployment[] = [];
  warningMessage = '';
  isLoadingMachineDeployments = false;
  clusterProvider: ExternalClusterProvider;

  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  @ViewChild('clusterNameInput', {static: true}) clusterNameInputRef: ElementRef;
  private readonly _googleAnalyticsEventCategory = 'clusterOverview';
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _clipboardService: ClipboardService,
    private readonly _dialogRef: MatDialogRef<ExternalClusterDeleteConfirmationComponent>,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._googleAnalyticsService.emitEvent(this._googleAnalyticsEventCategory, 'deleteExternalClusterDialogOpened');

    if (this.projectID && this.cluster) {
      this.isLoadingMachineDeployments = true;
      this.clusterProvider = ExternalCluster.getProvider(this.cluster.cloud);
      this._clusterService
        .externalMachineDeployments(this.projectID, this.cluster?.id)
        .pipe(
          take(1),
          finalize(() => (this.isLoadingMachineDeployments = false))
        )
        .subscribe((machineDeployments: ExternalMachineDeployment[]) => {
          this.machineDeployments = machineDeployments;
          if (machineDeployments.length > 0) {
            const nodegroupNames = machineDeployments.map((md: ExternalMachineDeployment) => md.name).join(', ');
            if (this.clusterProvider === ExternalClusterProvider.EKS) {
              this.warningMessage = `Cluster has nodegroups attached (<b>${nodegroupNames}</b>). Please delete nodegroups before deleting the cluster.`;
            } else {
              this.warningMessage = `Cluster has nodegroups attached (<b>${nodegroupNames}</b>).`;
            }
          } else {
            this.warningMessage = '';
          }
        });
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngAfterContentChecked(): void {
    this.clusterNameInputRef.nativeElement.focus();
  }

  copy(clipboard: string): void {
    this._clipboardService.copy(clipboard);
  }

  getObservable(): Observable<void> {
    return this._externalClusterService
      .deleteExternalCluster(this.projectID, this.cluster.id, DeleteExternalClusterAction.Delete)
      .pipe(take(1));
  }

  onNext(): void {
    this._dialogRef.close(true);
    this._googleAnalyticsService.emitEvent(this._googleAnalyticsEventCategory, 'externalClusterDeleted');
    this._notificationService.success(`Deleting the ${this.cluster.name} cluster`);
    this._clusterService.refreshExternalClusters();
  }

  disableDeletion(): boolean {
    return (
      this.inputName !== this.cluster.name ||
      this.isLoadingMachineDeployments ||
      (this.machineDeployments.length && this.clusterProvider === ExternalClusterProvider.EKS)
    );
  }
}
