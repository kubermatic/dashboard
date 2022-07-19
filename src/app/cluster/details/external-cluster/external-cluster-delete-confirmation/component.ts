// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {AfterContentChecked, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {NotificationService} from '@core/services/notification';
import {AdminSettings} from '@shared/entity/settings';
import {ClipboardService} from 'ngx-clipboard';
import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {ExternalClusterService} from '@core/services/external-cluster';
import {ClusterService} from '@core/services/cluster';

@Component({
  selector: 'km-external-cluster-delete-confirmation',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class ExternalClusterDeleteConfirmationComponent implements OnInit, OnDestroy, AfterContentChecked {
  @Input() projectID: string;
  @Input() cluster: ExternalCluster;
  @ViewChild('clusterNameInput', {static: true}) clusterNameInputRef: ElementRef;
  inputName = '';
  settings: AdminSettings;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _clipboardService: ClipboardService,
    private readonly _dialogRef: MatDialogRef<ExternalClusterDeleteConfirmationComponent>,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteClusterDialogOpened');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngAfterContentChecked(): void {
    this.clusterNameInputRef.nativeElement.focus();
  }

  onChange(event: any): void {
    this.inputName = event.target.value;
  }

  copy(clipboard: string): void {
    this._clipboardService.copy(clipboard);
  }

  getObservable(): Observable<void> {
    return this._externalClusterService.deleteExternalCluster(this.projectID, this.cluster.id, 'delete').pipe(take(1));
  }

  onNext(): void {
    this._dialogRef.close(true);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterDeleted');
    this._notificationService.success(`Deleting the ${this.cluster.name} cluster`);
    this._clusterService.refreshExternalClusters();
  }
}
