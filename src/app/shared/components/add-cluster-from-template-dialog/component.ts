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

import {Component, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MatStepper} from '@angular/material/stepper';
import {Router} from '@angular/router';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {NotificationService} from '@core/services/notification';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {Observable, Subject} from 'rxjs';
import {filter, take, takeUntil} from 'rxjs/operators';

export enum Step {
  Template = 'Select Template',
  Cluster = 'Create Cluster',
}

export class AddClusterFromTemplateDialogData {
  projectId: string;
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

  getObservable(): Observable<any> {
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
}
