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

import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DatacenterService} from '@core/services/datacenter';
import {Datacenter} from '@shared/entity/datacenter';
import {INTERNAL_NODE_PROVIDERS} from '@shared/model/NodeProviderConstants';
import {getIconClassForButton} from '@shared/utils/common-utils';
import * as countryCodeLookup from 'country-code-lookup';
import * as y from 'js-yaml';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
  RequiredEmailDomains = 'requiredEmailDomains',
  EnforcePodSecurityPolicy = 'enforcePodSecurityPolicy',
  EnforceAuditLogging = 'enforceAuditLogging',
}

@Component({
  selector: 'km-add-admin-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DatacenterDataDialogComponent implements OnInit, OnDestroy {
  readonly controls = Controls;
  readonly separatorKeyCodes: number[] = [ENTER, COMMA];
  readonly countryCodes: string[] = countryCodeLookup.countries.map(country => country.iso2);
  readonly providers = INTERNAL_NODE_PROVIDERS;
  seeds: string[] = [];
  form: FormGroup;
  requiredEmailDomains: string[] = [];
  providerConfig = '';
  private _unsubscribe = new Subject<void>();

  constructor(
    public _matDialogRef: MatDialogRef<DatacenterDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatacenterDataDialogConfig,
    private readonly _datacenterService: DatacenterService
  ) {}

  ngOnInit(): void {
    this._datacenterService.seeds.pipe(takeUntil(this._unsubscribe)).subscribe(seeds => (this.seeds = seeds));

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
      requiredEmailDomains: new FormControl(),
      enforcePodSecurityPolicy: new FormControl(
        this.data.isEditing && this.data.datacenter.spec.enforcePodSecurityPolicy
      ),
      enforceAuditLogging: new FormControl(this.data.isEditing && this.data.datacenter.spec.enforceAuditLogging),
    });

    this._initRequiredEmailDomainsInput();
    this._initProviderConfigEditor();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  private _initRequiredEmailDomainsInput(): void {
    if (this.data.isEditing && !_.isEmpty(this.data.datacenter.spec.requiredEmailDomains)) {
      this.requiredEmailDomains = this.data.datacenter.spec.requiredEmailDomains;
    } else {
      this.requiredEmailDomains = [];
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

  getCountryName(code: string): string {
    if (!code) {
      return '';
    }

    const country = countryCodeLookup.byIso(code);
    return country ? country.country : code;
  }

  addDomain(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.requiredEmailDomains.push(value.trim());
    }

    if (input) {
      input.value = '';
    }
  }

  removeDomain(domain: string): void {
    const index = this.requiredEmailDomains.indexOf(domain);

    if (index >= 0) {
      this.requiredEmailDomains.splice(index, 1);
    }
  }

  private _getProviderConfig(): any {
    const raw = y.load(this.providerConfig);
    return !_.isEmpty(raw) ? raw : {};
  }

  save(): void {
    const datacenter: Datacenter = {
      metadata: {
        name: this.form.controls.name.value,
      },
      spec: {
        provider: this.form.get(Controls.Provider).value,
        seed: this.form.get(Controls.Seed).value,
        country: this.form.get(Controls.Country).value,
        location: this.form.get(Controls.Location).value,
        requiredEmailDomains: this.requiredEmailDomains,
        enforcePodSecurityPolicy: this.form.get(Controls.EnforcePodSecurityPolicy).value,
        enforceAuditLogging: this.form.get(Controls.EnforceAuditLogging).value,
      },
    };

    datacenter.spec[datacenter.spec.provider] = this._getProviderConfig();

    // Nullify old provider value (it is needed to make edit work as it uses JSON Merge Patch).
    if (this.data.isEditing && datacenter.spec.provider !== this.data.datacenter.spec.provider) {
      datacenter.spec[this.data.datacenter.spec.provider] = null;
    }

    this._matDialogRef.close(datacenter);
  }
}
