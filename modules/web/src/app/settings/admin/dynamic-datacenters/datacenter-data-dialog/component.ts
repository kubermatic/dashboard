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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {NotificationService} from '@core/services/notification';
import {DatacenterService} from '@core/services/datacenter';
import {CreateDatacenterModel, Datacenter, MachineFlavorFilter} from '@shared/entity/datacenter';
import {DialogActionMode} from '@shared/types/common';
import {INTERNAL_NODE_PROVIDERS} from '@shared/model/NodeProviderConstants';
import {getIconClassForButton} from '@shared/utils/common';
import * as countryCodeLookup from 'country-code-lookup';
import * as y from 'js-yaml';
import _ from 'lodash';
import {Observable, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

export interface DatacenterDataDialogConfig {
  title: string;
  confirmLabel: string;
  isEditing: boolean;

  // Datacenter has to be specified only if dialog is used in the edit mode.
  datacenter?: Datacenter;
}

export enum Controls {
  Name = 'name',
  Provider = 'provider',
  Seed = 'seed',
  Country = 'country',
  Location = 'location',
  RequiredEmails = 'requiredEmails',
  EnforcePodSecurityPolicy = 'enforcePodSecurityPolicy',
  EnforceAuditLogging = 'enforceAuditLogging',
  MachineFlavorFilter = 'machineFlavorFilter',
}

enum Title {
  Add = 'Add Datacenter',
  Edit = 'Edit Datacenter',
}

@Component({
  selector: 'km-add-admin-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DatacenterDataDialogComponent implements OnInit, OnDestroy {
  private _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  readonly domainRegex = '^(?!-)[A-Za-z0-9-]+([\\-.][a-z0-9]+)*\\.[A-Za-z]{2,6}$';
  readonly countryCodes: string[] = countryCodeLookup.countries.map(country => country.iso2);
  readonly providers = INTERNAL_NODE_PROVIDERS;
  seeds: string[] = [];
  form: FormGroup;
  requiredEmails: string[] = [];
  providerConfig = '';
  machineFlavorFilter: MachineFlavorFilter;

  constructor(
    public _matDialogRef: MatDialogRef<DatacenterDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatacenterDataDialogConfig,
    private readonly _datacenterService: DatacenterService,
    private readonly _notificationService: NotificationService
  ) {}

  get label(): string {
    switch (this.data.confirmLabel) {
      case DialogActionMode.Add:
        return 'Add Datacenter';
      case DialogActionMode.Edit:
        return 'Save Changes';
      default:
        return '';
    }
  }

  ngOnInit(): void {
    this._datacenterService.seeds.pipe(takeUntil(this._unsubscribe)).subscribe(seeds => (this.seeds = seeds));

    if (this.data.isEditing) {
      this.machineFlavorFilter = _.cloneDeep(this.data.datacenter?.spec?.machineFlavorFilter);
    }

    this.form = new FormGroup({
      name: new FormControl(this.data.isEditing ? this.data.datacenter.metadata.name : '', [Validators.required]),
      provider: new FormControl(
        {value: this.data.isEditing ? this.data.datacenter.spec.provider : '', disabled: this.data.isEditing},
        [Validators.required]
      ),
      seed: new FormControl(
        {value: this.data.isEditing ? this.data.datacenter.spec.seed : '', disabled: this.data.isEditing},
        [Validators.required]
      ),
      country: new FormControl(this.data.isEditing ? this.data.datacenter.spec.country : '', [Validators.required]),
      location: new FormControl(this.data.isEditing ? this.data.datacenter.spec.location : '', [Validators.required]),
      requiredEmails: new FormControl([]),
      enforcePodSecurityPolicy: new FormControl(
        this.data.isEditing && this.data.datacenter.spec.enforcePodSecurityPolicy
      ),
      enforceAuditLogging: new FormControl(this.data.isEditing && this.data.datacenter.spec.enforceAuditLogging),
      machineFlavorFilter: new FormControl(),
    });

    this._initRequiredEmailsInput();
    this._initProviderConfigEditor();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  onRequiredEmailsChange(requiredEmails: string[]): void {
    this.requiredEmails = requiredEmails;
    this.form.get(Controls.RequiredEmails).updateValueAndValidity();
  }

  getCountryName(code: string): string {
    if (!code) {
      return '';
    }

    const country = countryCodeLookup.byIso(code);
    return country ? country.country : code;
  }

  getObservable(): Observable<Datacenter> | void {
    const datacenter: Datacenter = {
      metadata: {
        name: this.form.controls.name.value,
      },
      spec: {
        provider: this.form.get(Controls.Provider).value,
        seed: this.form.get(Controls.Seed).value,
        country: this.form.get(Controls.Country).value,
        location: this.form.get(Controls.Location).value,
        requiredEmails: this.requiredEmails,
        enforcePodSecurityPolicy: this.form.get(Controls.EnforcePodSecurityPolicy).value,
        enforceAuditLogging: this.form.get(Controls.EnforceAuditLogging).value,
        machineFlavorFilter: this.form.get(Controls.MachineFlavorFilter).value,
      },
    };

    datacenter.spec[datacenter.spec.provider] = this._getProviderConfig();

    // Nullify old provider value (it is needed to make edit work as it uses JSON Merge Patch).
    if (this.data.isEditing && datacenter.spec.provider !== this.data.datacenter.spec.provider) {
      datacenter.spec[this.data.datacenter.spec.provider] = null;
    }

    const model: CreateDatacenterModel = {
      name: datacenter.metadata.name,
      spec: datacenter.spec,
    };
    switch (this.data.title) {
      case Title.Add:
        return this._datacenterService.createDatacenter(model).pipe(take(1));
      case Title.Edit:
        return this._datacenterService
          .patchDatacenter(datacenter.spec.seed, datacenter.metadata.name, datacenter)
          .pipe(take(1));
    }
  }

  onNext(datacenter: Datacenter): void {
    switch (this.data.title) {
      case Title.Add:
        this._notificationService.success(`Created the ${datacenter.metadata.name} datacenter`);
        this._datacenterService.refreshDatacenters();
        break;
      case Title.Edit:
        this._notificationService.success(`Updated the ${datacenter.metadata.name} datacenter`);
        this._datacenterService.refreshDatacenters();
        break;
    }
    this._matDialogRef.close();
  }

  private _initRequiredEmailsInput(): void {
    if (this.data.isEditing && !_.isEmpty(this.data.datacenter.spec.requiredEmails)) {
      this.requiredEmails = this.data.datacenter.spec.requiredEmails;
    } else {
      this.requiredEmails = [];
    }
  }

  private _initProviderConfigEditor(): void {
    if (this.data.isEditing && this.data.datacenter.spec.provider) {
      const spec = this.data.datacenter.spec[this.data.datacenter.spec.provider];
      if (!_.isEmpty(spec)) {
        this.providerConfig = y.dump(spec);
      }
    }
  }

  private _getProviderConfig(): any {
    const raw = y.load(this.providerConfig);
    return !_.isEmpty(raw) ? raw : {};
  }
}
