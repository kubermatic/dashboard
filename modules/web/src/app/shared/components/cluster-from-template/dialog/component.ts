// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, Inject, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {NotificationService} from '@core/services/notification';
import {ClusterTemplate, ClusterTemplateInstance} from '@shared/entity/cluster-template';
import {Observable, Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';

export class ClusterFromTemplateDialogData {
  template: ClusterTemplate;
  projectID: string;
  quotaWidget: TemplateRef<QuotaWidgetComponent>;
}

@Component({
    selector: 'km-cluster-from-template-dialog',
    templateUrl: './template.html',
    standalone: false
})
export class ClusterFromTemplateDialogComponent implements OnInit, OnDestroy {
  showDetails = false;
  replicas: number;
  quotaWidget: TemplateRef<QuotaWidgetComponent>;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ClusterFromTemplateDialogData,
    public dialogRef: MatDialogRef<ClusterFromTemplateDialogComponent>,
    private readonly _router: Router,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.quotaWidget = this.data.quotaWidget;

    this._clusterTemplateService.replicasChanges
      .pipe(filter(replicas => !!replicas))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(replicas => (this.replicas = replicas));
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get valid(): boolean {
    return this._clusterTemplateService.isClusterStepValid;
  }

  getObservable(): Observable<ClusterTemplateInstance> {
    return this._clusterTemplateService
      .createInstances(this.replicas, this.data.projectID, this.data.template.id)
      .pipe(take(1));
  }

  onNext(): void {
    this.dialogRef.close();
    this._router.navigate([`/projects/${this.data.projectID}/clusters`]);
    this._notificationService.success(
      `Created ${this.replicas} instance${this.replicas > 1 ? 's' : ''} from ${this.data.template.name} template`
    );
  }
}
