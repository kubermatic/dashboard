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

import {Component, Input, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {shrinkGrow} from '@shared/animations/grow';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {Subject} from 'rxjs';
import {switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';

enum Control {
  Replicas = 'replicas',
}

@Component({
  selector: 'km-cluster-from-template-content',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  animations: [shrinkGrow],
  standalone: false,
})
export class ClusterFromTemplateComponent implements OnInit, OnDestroy {
  @Input() template: ClusterTemplate;
  @Input() projectId: string;
  @Input() showDetails = false;
  @Input() quotaWidget: TemplateRef<QuotaWidgetComponent>;

  control = Control;
  datacenter: Datacenter;
  seedSettings: SeedSettings;
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _clusterTemplateService: ClusterTemplateService
  ) {}

  ngOnInit() {
    this._datacenterService
      .getDatacenter(this.template.cluster.spec.cloud.dc)
      .pipe(tap(dc => (this.datacenter = dc)))
      .pipe(switchMap(dc => this._datacenterService.seedSettings(dc.spec.seed)))
      .pipe(take(1))
      .subscribe(seedSettings => (this.seedSettings = seedSettings));

    this.form = new FormGroup({[Control.Replicas]: new FormControl(1)});

    this.form
      .get(Control.Replicas)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(replicas => (this._clusterTemplateService.replicas = replicas));

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterTemplateService.clusterStepValidity = this.form.valid));
  }

  get sshKeys(): string[] {
    return this.template.userSshKeys ? this.template.userSshKeys.map(key => key.name) : [];
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
