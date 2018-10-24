import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService, ProjectService } from '../../../core/services';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { Subscription } from 'rxjs';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { ClusterEntityPatch } from '../../../shared/entity/ClusterEntityPatch';

@Component({
  selector: 'kubermatic-change-cluster-version',
  templateUrl: './change-cluster-version.component.html',
  styleUrls: ['./change-cluster-version.component.scss']
})
export class ChangeClusterVersionComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public possibleVersions: string[];
  public selectedVersion: string;
  public project: ProjectEntity;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private projectService: ProjectService,
              private dialogRef: MatDialogRef<ChangeClusterVersionComponent>,
              public googleAnalyticsService: GoogleAnalyticsService) {
  }

  public ngOnInit() {
    if (this.possibleVersions.length > 0) {
      this.selectedVersion = this.possibleVersions[this.possibleVersions.length - 1];
    }

    this.project = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));

    this.googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChangeDialogOpened');
  }

  changeVersion(): void {
    const patch: ClusterEntityPatch = {
      spec: {
        version: this.selectedVersion,
      }
    };

    this.api.patchCluster(patch, this.cluster.id, this.datacenter.metadata.name, this.project.id).subscribe(r => {
      this.cluster = r;
      this.dialogRef.close();
      NotificationActions.success('Success', `Cluster Version is being changed`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChanged');
      this.selectedVersion = null;
    });

  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
