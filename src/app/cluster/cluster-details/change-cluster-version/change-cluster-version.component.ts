import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {ClusterService, NotificationService, ProjectService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/datacenter';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';

@Component({
  selector: 'km-change-cluster-version',
  templateUrl: './change-cluster-version.component.html',
})
export class ChangeClusterVersionComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  controlPlaneVersions: string[] = [];
  selectedVersion: string;
  project: ProjectEntity;
  isNodeDeploymentUpgradeEnabled = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private _clusterService: ClusterService,
    private _projectService: ProjectService,
    private _dialogRef: MatDialogRef<ChangeClusterVersionComponent>,
    public _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.controlPlaneVersions.length > 0) {
      this.selectedVersion = this.controlPlaneVersions[this.controlPlaneVersions.length - 1];
    }

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
    this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChangeDialogOpened');
  }

  changeVersion(): void {
    const patch: ClusterEntityPatch = {
      spec: {
        version: this.selectedVersion,
      },
    };

    this._clusterService.patch(this.project.id, this.cluster.id, this.datacenter.metadata.name, patch).subscribe(() => {
      this._notificationService.success(
        `The <strong>${this.cluster.name}</strong> cluster is being updated to the ${this.selectedVersion} version`
      );
      this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChanged');

      if (this.isNodeDeploymentUpgradeEnabled) {
        this.upgradeNodeDeployments();
      }
    });

    this._dialogRef.close(true);
  }

  upgradeNodeDeployments(): void {
    this._clusterService
      .upgradeNodeDeployments(this.project.id, this.cluster.id, this.datacenter.metadata.name, this.selectedVersion)
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `The node deployments from the <strong>${this.cluster.name}</strong> cluster are being updated to the ${this.selectedVersion} version`
        );
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
