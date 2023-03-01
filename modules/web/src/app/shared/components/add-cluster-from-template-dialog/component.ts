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

import {Component, Inject, OnDestroy, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import {MatStepper} from '@angular/material/stepper';
import {Router} from '@angular/router';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {NotificationService} from '@core/services/notification';
import {ClusterTemplate, ClusterTemplateInstance} from '@shared/entity/cluster-template';
import {Observable, Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {WizardMode} from '@app/wizard/types/wizard-mode';

export enum Step {
  Template = 'Select Template',
  Cluster = 'Create Cluster',
}

export class AddClusterFromTemplateDialogData {
  projectId: string;
  quotaWidget: TemplateRef<QuotaWidgetComponent>;
  templateId?: string;
}

@Component({
  selector: 'km-add-cluster-from-template-dialog',
  templateUrl: './template.html',
})
export class AddClusterFromTemplateDialogComponent implements OnInit, OnDestroy {
  showDetails = false;
  template: ClusterTemplate;
  replicas: number;
  steps: Step[] = [Step.Template, Step.Cluster];
  quotaWidget: TemplateRef<QuotaWidgetComponent>;
  readonly step = Step;
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddClusterFromTemplateDialogData,
    private readonly _matDialogRef: MatDialogRef<AddClusterFromTemplateDialogComponent>,
    private readonly _router: Router,
    private readonly _notificationService: NotificationService,
    private readonly _clusterTemplateService: ClusterTemplateService
  ) {}

  ngOnInit(): void {
    this.quotaWidget = this.data.quotaWidget;

    this._clusterTemplateService.templateChanges
      .pipe(filter(template => !!template))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(template => (this.template = template));

    this._clusterTemplateService.replicasChanges
      .pipe(filter(replicas => !!replicas))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(replicas => (this.replicas = replicas));
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._clusterTemplateService.reset();
  }

  get active(): string {
    return this.steps[this._stepper.selectedIndex];
  }

  get last(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get invalid(): boolean {
    switch (this.active) {
      case Step.Template:
        return !this._clusterTemplateService.isTemplateStepValid;
      case Step.Cluster:
        return !this._clusterTemplateService.isClusterStepValid;
      default:
        return true;
    }
  }

  getObservable(): Observable<ClusterTemplateInstance> {
    return this._clusterTemplateService
      .createInstances(this.replicas, this.data.projectId, this.template.id)
      .pipe(take(1));
  }

  onNext() {
    this._matDialogRef.close();
    this._notificationService.success(
      `Created ${this.replicas} instance${this.replicas > 1 ? 's' : ''} from ${this.template.name} template`
    );
    this._router.navigate([`/projects/${this.data.projectId}/clusters`]);
  }

  isAvailable(step: Step): boolean {
    return this.steps.indexOf(step) > -1;
  }

  next(): void {
    this._stepper.next();
  }

  openClusterWizard(): void {
    this._matDialogRef.close();

    // We chose optional query params instead of creating new route or using state behind the curtain.
    this._router.navigate([`/projects/${this.data.projectId}/wizard`], {
      queryParams: {clusterTemplateID: this.template.id},
      state: {mode: WizardMode.CustomizeClusterTemplate},
    });
  }
}
