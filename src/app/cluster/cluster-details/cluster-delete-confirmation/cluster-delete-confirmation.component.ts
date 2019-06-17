import {Component, DoCheck, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {AppConfigService} from '../../../app-config.service';
import {ClusterService} from '../../../core/services';
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
  @ViewChild('clusterNameInput', {static: true}) clusterNameInputRef: ElementRef;

  deleteForm: FormGroup;
  inputName = '';

  constructor(
      private readonly _clusterService: ClusterService,
      private readonly _dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _appConfig: AppConfigService) {
  }

  ngOnInit(): void {
    this.deleteForm = new FormGroup({
      clusterLBCleanupCheckbox: new FormControl(!!this._appConfig.getConfig().cleanup_cluster),
      clusterVolumeCleanupCheckbox: new FormControl(!!this._appConfig.getConfig().cleanup_cluster),
    });
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteClusterDialogOpened');
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
      this._clusterService
          .delete(this.projectID, this.cluster.id, this.datacenter.metadata.name, {
            [Finalizer.DeleteLoadBalancers]: !!this.deleteForm.controls.clusterLBCleanupCheckbox.value,
            [Finalizer.DeleteVolumes]: !!this.deleteForm.controls.clusterVolumeCleanupCheckbox.value,
          })
          .subscribe(() => {
            NotificationActions.success(`Cluster ${this.cluster.name} is being deleted`);
            this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterDeleted');
            this._clusterService.refreshClusters();
          });
      this._dialogRef.close(true);
    }
  }
}
