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

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, NutanixCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {isObjectEmpty} from '@shared/utils/common';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {NutanixProject} from '@shared/entity/provider/nutanix';
import _ from 'lodash';

enum Controls {
  ProjectName = 'projectName',
}

enum ProjectState {
  Ready = 'Project',
  Empty = 'No projects available',
  Loading = 'Loading...',
}

@Component({
  selector: 'km-wizard-nutanix-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NutanixProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NutanixProviderExtendedComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutanixProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @ViewChild('projectCombobox')
  private readonly _projectCombobox: FilteredComboboxComponent;
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  projects: NutanixProject[] = [];
  projectLabel = ProjectState.Empty;
  isPresetSelected = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('Nutanix Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProjectName]: this._builder.control(''),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterSpecService.cluster.spec.cloud.nutanix)));

    this.form
      .get(Controls.ProjectName)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getCluster()));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (!this._hasRequiredCredentials()) {
            this._clearProject();
          }
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(switchMap(_ => this._projectListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadProjects.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.ProjectName:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }
  }

  private _onProjectLoading(): void {
    this._clearProject();
    this.projectLabel = ProjectState.Loading;
    this._cdr.detectChanges();
  }

  private _projectListObservable(): Observable<NutanixProject[]> {
    return this._presets
      .provider(NodeProvider.NUTANIX)
      .username(this._clusterSpecService.cluster.spec.cloud.nutanix.username)
      .password(this._clusterSpecService.cluster.spec.cloud.nutanix.password)
      .proxyURL(this._clusterSpecService.cluster.spec.cloud.nutanix.proxyURL)
      .projects(this._clusterSpecService.cluster.spec.cloud.dc, this._onProjectLoading.bind(this))
      .pipe(map(projects => _.sortBy(projects, p => p.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearProject();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _loadProjects(projects: NutanixProject[]): void {
    this.projectLabel = !_.isEmpty(projects) ? ProjectState.Ready : ProjectState.Empty;
    this.projects = projects;
    this._cdr.detectChanges();
  }

  private _clearProject(): void {
    this.projects = [];
    this.projectLabel = ProjectState.Empty;
    this._projectCombobox.reset();
    this._cdr.detectChanges();
  }

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.nutanix.username &&
      !!this._clusterSpecService.cluster.spec.cloud.nutanix.password
    );
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getCluster(): Cluster {
    return {
      spec: {
        cloud: {
          nutanix: {
            projectName: this.form.get(Controls.ProjectName).value,
          } as NutanixCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
