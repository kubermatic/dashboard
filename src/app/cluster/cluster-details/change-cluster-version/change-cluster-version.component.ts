import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

import {ApiService, ProjectService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-change-cluster-version',
  templateUrl: './change-cluster-version.component.html',
})
export class ChangeClusterVersionComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  controlPlaneVersions: string[] = [];
  selectedVersion: string;
  project: ProjectEntity;
  isNodeDeploymentUpgradeEnabled = false;
  private subscriptions: Subscription[] = [];

  constructor(
      private _apiService: ApiService, private _projectService: ProjectService,
      private _dialogRef: MatDialogRef<ChangeClusterVersionComponent>,
      public _googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    if (this.controlPlaneVersions.length > 0) {
      this.selectedVersion = this.controlPlaneVersions[this.controlPlaneVersions.length - 1];
    }

    this.project = this._projectService.project;
    this.subscriptions.push(this._projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
    }));

    this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChangeDialogOpened');
  }

  changeVersion(): void {
    const patch: ClusterEntityPatch = {
      spec: {
        version: this.selectedVersion,
      },
    };

    this._apiService.patchCluster(patch, this.cluster.id, this.datacenter.metadata.name, this.project.id)
        .subscribe(() => {
          NotificationActions.success(
              'Success', `Cluster ${this.cluster.name} is being updated to version ${this.selectedVersion}`);
          this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChanged');

          if (this.isNodeDeploymentUpgradeEnabled) {
            this.upgradeNodeDeployments();
          }
        });

    this._dialogRef.close();
  }

  upgradeNodeDeployments(): void {
    this._apiService
        .upgradeClusterNodeDeployments(
            this.selectedVersion, this.cluster.id, this.datacenter.metadata.name, this.project.id)
        .pipe(first())
        .subscribe(() => {
          NotificationActions.success(
              'Success',
              `Node Deployments from cluster ${this.cluster.name} are being updated to version ${
                  this.selectedVersion}`);
        });
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
