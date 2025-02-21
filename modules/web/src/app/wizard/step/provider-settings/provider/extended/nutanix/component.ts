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
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {isObjectEmpty} from '@shared/utils/common';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {NutanixProject} from '@shared/entity/provider/nutanix';
import _ from 'lodash';
import {CloudSpec, Cluster, ClusterSpec, NutanixCloudSpec, NutanixCSIConfig} from '@shared/entity/cluster';

enum Controls {
  ProjectName = 'projectName',
  StorageContainer = 'storageContainer',
  Fstype = 'fstype',
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
  standalone: false,
})
export class NutanixProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  // Following fields will not be blocked when preset is selected and vice versa.
  // It allows setting storage class settings when the preset is used as it does not contain these fields.
  // See also: NutanixCloudSpec.isEmpty
  readonly _alwaysEnabledControls = [Controls.Fstype, Controls.StorageContainer];
  @ViewChild('projectCombobox')
  private readonly _projectCombobox: FilteredComboboxComponent;
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  readonly fstypes = ['xfs', 'ext4'];
  private _username = '';
  private _password = '';
  private _proxyURL = '';
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
      [Controls.StorageContainer]: this._builder.control(''),
      [Controls.Fstype]: this._builder.control(''),
    });

    merge(
      Object.values(Controls)
        .filter(control => !this._alwaysEnabledControls.includes(control))
        .map(control => this.form.get(control).valueChanges)
    )
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterSpecService.cluster.spec.cloud.nutanix)));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls)
        .filter(control => !this._alwaysEnabledControls.includes(control))
        .forEach(control => {
          this.isPresetSelected = !!preset;
          this._enable(!this.isPresetSelected, control);
        })
    );

    merge(this.form.get(Controls.StorageContainer).valueChanges, this.form.get(Controls.Fstype).valueChanges)
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

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
      .pipe(filter(cluster => this._areCredentialsChanged(cluster)))
      .pipe(switchMap(_ => this._projectListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadProjects.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _areCredentialsChanged(cluster: Cluster): boolean {
    let credentialsChanged = false;
    if (cluster.spec.cloud.nutanix.username !== this._username) {
      this._username = cluster.spec.cloud.nutanix.username;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.nutanix.password !== this._password) {
      this._password = cluster.spec.cloud.nutanix.password;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.nutanix.proxyURL !== this._proxyURL) {
      this._proxyURL = cluster.spec.cloud.nutanix.proxyURL;
      credentialsChanged = true;
    }

    return credentialsChanged;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.ProjectName:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
      default:
        return '';
    }
  }

  onProjectChange(projectName: string): void {
    this._clusterSpecService.cluster.spec.cloud.nutanix.projectName = projectName;
    this._clusterSpecService.providerSpecChanges.emit();
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

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          nutanix: {
            csi: {
              storageContainer: this.form.get(Controls.StorageContainer).value,
              fstype: this.form.get(Controls.Fstype).value,
            } as NutanixCSIConfig,
          } as NutanixCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
