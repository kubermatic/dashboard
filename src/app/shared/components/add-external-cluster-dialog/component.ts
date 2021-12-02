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

import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ExternalClusterService} from '@shared/components/add-external-cluster-dialog/steps/service';
import {MatStepper} from '@angular/material/stepper';
import {filter, take, takeUntil} from 'rxjs/operators';
import {NotificationService} from '@core/services/notification';
import {Router} from '@angular/router';
import {ExternalClusterProvider} from '@shared/entity/external-cluster';
import {ClusterService} from '@core/services/cluster';
import {Subject} from 'rxjs';

export enum Step {
  Provider = 'Pick Provider',
  Credentials = 'Enter Credentials',
  Cluster = 'Pick Cluster',
}

@Component({
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddExternalClusterDialogComponent implements OnInit, OnDestroy {
  @Input() projectId: string;

  steps: Step[] = [Step.Provider, Step.Credentials];
  form: FormGroup;

  readonly step = Step;
  readonly provider = ExternalClusterProvider;

  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;
  private readonly _unsubscribe = new Subject<void>();
  private _creating = false;

  constructor(
    private readonly _matDialogRef: MatDialogRef<AddExternalClusterDialogComponent>,
    private readonly _formBuilder: FormBuilder,
    private readonly _router: Router,
    private readonly _notificationService: NotificationService,
    private readonly _clusterService: ClusterService,
    readonly externalClusterService: ExternalClusterService
  ) {}

  ngOnInit(): void {
    const controls = {};
    this.steps.forEach(step => (controls[step] = this._formBuilder.control('')));
    this.form = this._formBuilder.group(controls);

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
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this.externalClusterService.reset();
  }

  get active(): string {
    return this.steps[this._stepper.selectedIndex];
  }

  get last(): boolean {
    return this._stepper.selectedIndex === this.steps.length - 1;
  }

  get creating(): boolean {
    return this._creating;
  }

  get invalid(): boolean {
    switch (this.active) {
      case Step.Provider:
        return this.form.get(Step.Provider).invalid;
      case Step.Credentials:
        return !this.externalClusterService.isCredentialsStepValid;
      case Step.Cluster:
        return !this.externalClusterService.isClusterStepValid;
      default:
        return true;
    }
  }

  isAvailable(step: Step): boolean {
    return this.steps.indexOf(step) > -1;
  }

  next(): void {
    this._stepper.next();
  }

  add(): void {
    this._creating = true;
    this._clusterService
      .addExternalCluster(this.projectId, this.externalClusterService.externalCluster)
      .pipe(take(1))
      .subscribe(
        cluster => {
          this._creating = false;
          this._matDialogRef.close();
          this._notificationService.success(`The ${cluster.name} cluster was added`);
          this._router.navigate([`/projects/${this.projectId}/clusters/external/${cluster.id}`]);
        },
        () => (this._creating = false)
      );
  }
}
