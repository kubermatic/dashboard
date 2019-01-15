import {Component, DoCheck, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {AppConfigService} from '../../../app-config.service';
import {ApiService, InitialNodeDataService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity, Finalizer} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['cluster-delete-confirmation.component.scss'],
})
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @ViewChild('clusterNameInput') clusterNameInputRef: ElementRef;

  deleteForm: FormGroup;
  inputName = '';

  constructor(
      private api: ApiService, private dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
      private initialNodeDataService: InitialNodeDataService, public googleAnalyticsService: GoogleAnalyticsService,
      private _appConfig: AppConfigService) {}

  ngOnInit(): void {
    this.deleteForm = new FormGroup({
      clusterLBCleanupCheckbox: new FormControl(!!this._appConfig.getConfig().cleanup_cluster),
      clusterVolumeCleanupCheckbox: new FormControl(!!this._appConfig.getConfig().cleanup_cluster),
    });
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteClusterDialogOpened');
  }

  ngDoCheck(): void {
    this.clusterNameInputRef.nativeElement.focus();
  }

  onChange(event: any): void {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    return this.inputName === this.cluster.name;
  }

  deleteCluster(): void {
    if (!this.inputNameMatches()) {
      return;
    } else {
      this.api
          .deleteCluster(this.cluster.id, this.datacenter.metadata.name, this.projectID, {
            [Finalizer.DeleteLoadBalancers]: !!this.deleteForm.controls.clusterLBCleanupCheckbox.value,
            [Finalizer.DeleteVolumes]: !!this.deleteForm.controls.clusterVolumeCleanupCheckbox.value,
          })
          .subscribe(() => {
            this.initialNodeDataService.clearInitialNodeData(this.cluster);
            NotificationActions.success('Success', `Cluster is being deleted`);
            this.googleAnalyticsService.emitEvent('clusterOverview', 'clusterDeleted');
          });
      this.dialogRef.close(true);
    }
  }
}
