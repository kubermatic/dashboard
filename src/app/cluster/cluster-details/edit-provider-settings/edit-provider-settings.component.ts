import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ApiService, ProjectService, ClusterService } from '../../../core/services';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ClusterProviderSettingsData } from '../../../shared/model/ClusterSpecChange';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

@Component({
  selector: 'kubermatic-edit-provider-settings',
  templateUrl: './edit-provider-settings.component.html',
  styleUrls: ['./edit-provider-settings.component.scss']
})

export class EditProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public providerSettingsData: ClusterProviderSettingsData = { valid: false };
  public project: ProjectEntity;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private clusterService: ClusterService,
              private projectService: ProjectService,
              private dialogRef: MatDialogRef<EditProviderSettingsComponent>,
              public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.subscriptions.push(this.clusterService.providerSettingsDataChanges$.subscribe(async (data: ClusterProviderSettingsData) => {
      this.providerSettingsData = await data;
    }));

    this.project = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));

    this.googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsDialogOpened');
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public saveProviderSettings() {
    if (!!this.cluster.spec.cloud.aws) {
      this.cluster.spec.cloud.aws = this.providerSettingsData.aws;
    } else if (!!this.cluster.spec.cloud.digitalocean) {
      this.cluster.spec.cloud.digitalocean = this.providerSettingsData.digitalocean;
    } else if (!!this.cluster.spec.cloud.hetzner) {
      this.cluster.spec.cloud.hetzner = this.providerSettingsData.hetzner;
    } else if (!!this.cluster.spec.cloud.openstack) {
      this.cluster.spec.cloud.openstack = this.providerSettingsData.openstack;
    } else if (!!this.cluster.spec.cloud.vsphere) {
      this.cluster.spec.cloud.vsphere = this.providerSettingsData.vsphere;
    } else if (!!this.cluster.spec.cloud.azure) {
      this.cluster.spec.cloud.azure = this.providerSettingsData.azure;
    }

    this.api.editCluster(this.cluster, this.datacenter.metadata.name, this.project.id).subscribe(res => {
      NotificationActions.success('Success', `Edit provider settings successfully`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsSaved');
      this.dialogRef.close(res);
    });
  }
}
