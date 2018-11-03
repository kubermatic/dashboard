import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { ApiService, ClusterService, ProjectService } from '../../../core/services';
import { ProviderSettingsPatch } from '../../../core/services/cluster/cluster.service';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ClusterEntityPatch } from '../../../shared/entity/ClusterEntityPatch';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-edit-provider-settings',
  templateUrl: './edit-provider-settings.component.html',
  styleUrls: ['./edit-provider-settings.component.scss'],
})

export class EditProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public project: ProjectEntity;
  private subscriptions: Subscription[] = [];
  public providerSettingsPatch: ProviderSettingsPatch = {
    isValid: false,
    cloudSpecPatch: {},
  };

  constructor(private api: ApiService,
              private clusterService: ClusterService,
              private projectService: ProjectService,
              private dialogRef: MatDialogRef<EditProviderSettingsComponent>,
              public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.subscriptions.push(this.clusterService.providerSettingsPatchChanges$.subscribe(async (patch: ProviderSettingsPatch) => {
      this.providerSettingsPatch = await patch;
    }));

    this.project = this.projectService.project;
    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
    }));

    this.googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsDialogOpened');
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  public saveProviderSettings(): void {
    const patch: ClusterEntityPatch = {
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
      },
    };

    this.api.patchCluster(patch, this.cluster.id, this.datacenter.metadata.name, this.project.id).subscribe((r) => {
      this.cluster = r;
      NotificationActions.success('Success', `Edit provider settings successfully`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsSaved');
      this.dialogRef.close(r);
    });
  }
}
