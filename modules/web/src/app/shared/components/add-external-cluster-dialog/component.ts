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

import {Component, Input, OnDestroy, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {ExternalClusterService} from '@core/services/external-cluster';
import {MatStepper} from '@angular/material/stepper';
import {filter, take, takeUntil} from 'rxjs/operators';
import {NotificationService} from '@core/services/notification';
import {Router} from '@angular/router';
import {ExternalCluster, ExternalClusterProvider} from '@shared/entity/external-cluster';
import {Observable, Subject} from 'rxjs';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {View} from '@app/shared/entity/common';

export enum Step {
  Provider = 'Pick Provider',
  Credentials = 'Enter Credentials',
  Cluster = 'Pick Cluster',
}

@Component({
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class AddExternalClusterDialogComponent implements OnInit, OnDestroy {
  @Input() projectId: string;
  @Input() quotaWidget: TemplateRef<QuotaWidgetComponent>;
  steps: Step[] = [Step.Provider, Step.Credentials];
  readonly step = Step;
  readonly provider = ExternalClusterProvider;
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialogRef: MatDialogRef<AddExternalClusterDialogComponent>,
    private readonly _router: Router,
    private readonly _notificationService: NotificationService,
    readonly externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    this.externalClusterService.providerChanges
      .pipe(filter(provider => !!provider))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(provider => {
        this.steps =
          provider === ExternalClusterProvider.Custom
            ? [Step.Provider, Step.Credentials]
            : [Step.Provider, Step.Credentials, Step.Cluster];

        this._stepper.next();
      });

    this._stepper.selectionChange.pipe(takeUntil(this._unsubscribe)).subscribe(selection => {
      if (selection.previouslySelectedIndex > selection.selectedIndex) {
        selection.previouslySelectedStep.reset();
      }
    });
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this.externalClusterService.reset();
  }

  get label(): string {
    return this.externalClusterService.provider === ExternalClusterProvider.Custom
      ? 'Add External Cluster'
      : 'Import Cluster';
  }

  get active(): string {
    return this.steps[this._stepper.selectedIndex];
  }

  get last(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get first(): boolean {
    return this._stepper.selectedIndex === 0;
  }

  get invalid(): boolean {
    switch (this.active) {
      case Step.Provider:
        return !this.externalClusterService.provider;
      case Step.Credentials:
        return !this.externalClusterService.isCredentialsStepValid;
      case Step.Cluster:
        return !this.externalClusterService.isClusterStepValid;
      default:
        return true;
    }
  }

  getObservable(): Observable<ExternalCluster> {
    return this.externalClusterService
      .import(this.projectId, this.externalClusterService.externalCluster)
      .pipe(take(1));
  }

  onNext(cluster: ExternalCluster): void {
    this._matDialogRef.close();
    this._notificationService.success(`Added the ${cluster.name} cluster`);
    this._router.navigate([`/projects/${this.projectId}/${View.Clusters}/${View.ExternalClusters}/${cluster.id}`]);
  }

  isAvailable(step: Step): boolean {
    return this.steps.indexOf(step) > -1;
  }

  next(): void {
    this._stepper.next();
  }

  previous(): void {
    this._stepper.previous();
  }
}
