import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClusterService, ProjectService} from '../../../core/services';
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
      private readonly _clusterService: ClusterService, private readonly _projectService: ProjectService,
      private readonly _dialogRef: MatDialogRef<EditProviderSettingsComponent>,
      private readonly _googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this._clusterService.providerSettingsPatchChanges$.pipe(takeUntil(this._unsubscribe))
        .subscribe(async patch => this.providerSettingsPatch = await patch);

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .subscribe(project => this.project = project);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsDialogOpened');
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

    this._clusterService.patch(this.project.id, this.cluster.id, this.datacenter.metadata.name, patch)
        .subscribe((r) => {
          this.cluster = r;
          NotificationActions.success(`Edited provider settings for ${this.cluster.name} successfully`);
          this._googleAnalyticsService.emitEvent('clusterOverview', 'providerSettingsSaved');
          this._dialogRef.close(r);
        });
  }
}
