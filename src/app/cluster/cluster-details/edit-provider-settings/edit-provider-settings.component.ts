import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ApiService, ClusterService, ProjectService} from '../../../core/services';
import {ProviderSettingsPatch} from '../../../core/services/cluster/cluster.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-edit-provider-settings',
  templateUrl: './edit-provider-settings.component.html',
  styleUrls: ['./edit-provider-settings.component.scss'],
})

export class EditProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  project: ProjectEntity;
  providerSettingsPatch: ProviderSettingsPatch = {
    isValid: false,
    cloudSpecPatch: {},
  };

  private _unsubscribe = new Subject<void>();

  constructor(
      private api: ApiService, private clusterService: ClusterService, private projectService: ProjectService,
      private dialogRef: MatDialogRef<EditProviderSettingsComponent>,
      public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.clusterService.providerSettingsPatchChanges$.pipe(takeUntil(this._unsubscribe))
        .subscribe(async patch => this.providerSettingsPatch = await patch);

    this.projectService.selectedProject.pipe(takeUntil(this._unsubscribe)).subscribe(project => this.project = project);
    this.googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsDialogOpened');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  saveProviderSettings(): void {
    const patch: ClusterEntityPatch = {
      spec: {
        cloud: this.providerSettingsPatch.cloudSpecPatch,
      },
    };

    this.api.patchCluster(patch, this.cluster.id, this.datacenter.metadata.name, this.project.id).subscribe((r) => {
      this.cluster = r;
      NotificationActions.success('Success', `Edited provider settings for ${this.cluster.name} successfully`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsSaved');
      this.dialogRef.close(r);
    });
  }
}
