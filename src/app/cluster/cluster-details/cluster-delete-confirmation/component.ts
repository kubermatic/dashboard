// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, DoCheck, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ClusterService} from '@core/services/cluster/service';
import {NotificationService} from '@core/services/notification/service';
import {SettingsService} from '@core/services/settings/service';
import {Cluster, Finalizer} from '@shared/entity/cluster';
import {AdminSettings} from '@shared/entity/settings';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-cluster-delete-confirmation',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck, OnDestroy {
  @Input() cluster: Cluster;
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
    private readonly _dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.deleteForm = new FormGroup({
      clusterLBCleanupCheckbox: new FormControl({value: false}),
      clusterVolumeCleanupCheckbox: new FormControl({value: false}),
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this.deleteForm.controls.clusterLBCleanupCheckbox.setValue(this.settings.cleanupOptions.Enabled);
      this.deleteForm.controls.clusterVolumeCleanupCheckbox.setValue(this.settings.cleanupOptions.Enabled);
      if (this.settings.cleanupOptions.Enforced) {
        this.deleteForm.controls.clusterLBCleanupCheckbox.disable();
        this.deleteForm.controls.clusterVolumeCleanupCheckbox.disable();
      } else {
        this.deleteForm.controls.clusterLBCleanupCheckbox.enable();
        this.deleteForm.controls.clusterVolumeCleanupCheckbox.enable();
      }
      this.deleteForm.updateValueAndValidity();
    });

    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteClusterDialogOpened');
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
    }
    this._clusterService
      .delete(this.projectID, this.cluster.id, {
        [Finalizer.DeleteLoadBalancers]: !!this.deleteForm.controls.clusterLBCleanupCheckbox.value,
        [Finalizer.DeleteVolumes]: !!this.deleteForm.controls.clusterVolumeCleanupCheckbox.value,
      })
      .subscribe(() => {
        this._notificationService.success(`The ${this.cluster.name} is being deleted`);
        this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterDeleted');
        this._clusterService.refreshClusters();
      });
    this._dialogRef.close(true);
  }
}
