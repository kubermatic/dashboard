import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ApiService, InitialNodeDataService } from '../../../core/services';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  public inputName = '';

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
              private initialNodeDataService: InitialNodeDataService,
              public googleAnalyticsService: GoogleAnalyticsService) {
  }

  ngOnInit(): void {
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteClusterDialogOpened');
  }

  ngDoCheck(): void {
    document.getElementById('name').focus();
  }

  onChange(event: any) {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    return this.inputName === this.cluster.spec.humanReadableName;
  }

  deleteCluster() {
    if (!this.inputNameMatches()) {
      return;
    } else {
      this.api.deleteCluster(this.cluster.metadata.name, this.datacenter.metadata.name).subscribe(result => {
        this.initialNodeDataService.clearInitialNodeData(this.cluster);
        NotificationActions.success('Success', `Cluster is being deleted`);
        this.googleAnalyticsService.emitEvent('clusterOverview', 'clusterDeleted');
      });
      this.dialogRef.close(true);
    }
  }
}
