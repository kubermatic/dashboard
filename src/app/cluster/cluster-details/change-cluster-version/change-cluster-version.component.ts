import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService, ProjectService } from '../../../core/services';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { Subscription } from 'rxjs/Subscription';

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
              private dialogRef: MatDialogRef<ChangeClusterVersionComponent>) {
  }

  public ngOnInit() {
    if (this.possibleVersions.length > 0) {
      this.selectedVersion = this.possibleVersions[this.possibleVersions.length - 1];
    }

    this.project = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));
  }

  changeVersion(): void {
    this.cluster.spec.version = this.selectedVersion;

    this.api.editCluster(this.cluster, this.datacenter.metadata.name, this.project.id).subscribe(result => {
      this.dialogRef.close();
      NotificationActions.success('Success', `Cluster Version is being changed`);
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
