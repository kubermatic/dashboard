import {
  Component,
  DoCheck,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService, NotificationService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {AdminSettings} from '../../../shared/entity/AdminSettings';
import {ClusterEntity, Finalizer} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'km-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['cluster-delete-confirmation.component.scss'],
})
export class ClusterDeleteConfirmationComponent
  implements OnInit, DoCheck, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @ViewChild('clusterNameInput', {static: true})
  clusterNameInputRef: ElementRef;
  deleteForm: FormGroup;
  inputName = '';
  settings: AdminSettings;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _settingsService: SettingsService,
    private readonly _dialogRef: MatDialogRef<
      ClusterDeleteConfirmationComponent
    >,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.deleteForm = new FormGroup({
      clusterLBCleanupCheckbox: new FormControl({value: false}),
      clusterVolumeCleanupCheckbox: new FormControl({value: false}),
    });

    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(settings => {
        this.settings = settings;
        this.deleteForm.controls.clusterLBCleanupCheckbox.setValue(
          this.settings.cleanupOptions.Enabled
        );
        this.deleteForm.controls.clusterVolumeCleanupCheckbox.setValue(
          this.settings.cleanupOptions.Enabled
        );
        if (this.settings.cleanupOptions.Enforced) {
          this.deleteForm.controls.clusterLBCleanupCheckbox.disable();
          this.deleteForm.controls.clusterVolumeCleanupCheckbox.disable();
        } else {
          this.deleteForm.controls.clusterLBCleanupCheckbox.enable();
          this.deleteForm.controls.clusterVolumeCleanupCheckbox.enable();
        }
        this.deleteForm.updateValueAndValidity();
      });

    this._googleAnalyticsService.emitEvent(
      'clusterOverview',
      'deleteClusterDialogOpened'
    );
  }

  getCheckboxTooltip(): string {
    return this.settings && this.settings.cleanupOptions.Enforced
      ? 'These settings are enforced by the admin and cannot be changed.'
      : '';
  }

  ngDoCheck(): void {
    this.clusterNameInputRef.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  showWarning(): boolean {
    return this.settings && !this.settings.cleanupOptions.Enforced;
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
        .delete(
          this.projectID,
          this.cluster.id,
          this.datacenter.metadata.name,
          {
            [Finalizer.DeleteLoadBalancers]: !!this.deleteForm.controls
              .clusterLBCleanupCheckbox.value,
            [Finalizer.DeleteVolumes]: !!this.deleteForm.controls
              .clusterVolumeCleanupCheckbox.value,
          }
        )
        .subscribe(() => {
          this._notificationService.success(
            `Cluster ${this.cluster.name} is being deleted`
          );
          this._googleAnalyticsService.emitEvent(
            'clusterOverview',
            'clusterDeleted'
          );
          this._clusterService.refreshClusters();
        });
      this._dialogRef.close(true);
    }
  }
}
