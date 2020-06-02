import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {dump, load} from 'js-yaml';
import * as _ from 'lodash';

import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';

export interface DatacenterDataDialogConfig {
  title: string;
  confirmLabel: string;
  isEditing: boolean;

  // Datacenter has to be specified only if dialog is used in the edit mode.
  datacenter?: DataCenterEntity;
}

@Component({
  selector: 'km-add-admin-dialog',
  templateUrl: './datacenter-data-dialog.component.html',
  styleUrls: ['./datacenter-data-dialog.component.scss'],
})
export class DatacenterDataDialogComponent implements OnInit {
  form: FormGroup;
  providerConfig = '';
  editorOptions = {
    contextmenu: false,
    language: 'yaml',
    minimap: {
      enabled: false,
    },
    renderLineHighlight: 'none',
    scrollbar: {
      verticalScrollbarSize: 5,
      useShadows: false,
    },
    scrollBeyondLastLine: false,
  };

  constructor(
    public _matDialogRef: MatDialogRef<DatacenterDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatacenterDataDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(this.data.isEditing ? this.data.datacenter.metadata.name : '', [Validators.required]),
      provider: new FormControl(this.data.isEditing ? this.data.datacenter.spec.provider : '', [Validators.required]),
      seed: new FormControl(
        {value: this.data.isEditing ? this.data.datacenter.spec.seed : '', disabled: this.data.isEditing},
        [Validators.required]
      ),
      country: new FormControl(this.data.isEditing ? this.data.datacenter.spec.country : '', [Validators.required]),
      location: new FormControl(this.data.isEditing ? this.data.datacenter.spec.location : '', [Validators.required]),
      enforcePodSecurityPolicy: new FormControl(
        this.data.isEditing && this.data.datacenter.spec.enforcePodSecurityPolicy
      ),
      enforceAuditLogging: new FormControl(this.data.isEditing && this.data.datacenter.spec.enforceAuditLogging),
    });

    if (this.data.isEditing && this.data.datacenter.spec.provider) {
      const spec = this.data.datacenter.spec[this.data.datacenter.spec.provider];
      if (!_.isEmpty(spec)) {
        this.providerConfig = dump(spec);
      }
    }
  }

  private _getProviderConfig(): any {
    const raw = load(this.providerConfig);
    return !_.isEmpty(raw) ? raw : {};
  }

  submit(): void {
    const datacenter: DataCenterEntity = {
      metadata: {
        name: this.form.controls.name.value,
      },
      spec: {
        provider: this.form.controls.provider.value,
        seed: this.form.controls.seed.value,
        country: this.form.controls.country.value,
        location: this.form.controls.location.value,
        requiredEmailDomains: [],
        enforcePodSecurityPolicy: this.form.controls.enforcePodSecurityPolicy.value,
        enforceAuditLogging: this.form.controls.enforceAuditLogging.value,
      },
      seed: false,
    };

    datacenter.spec[datacenter.spec.provider] = this._getProviderConfig();

    // Nullify old provider value (it is needed to make edit work as it uses JSON Merge Patch).
    const oldProvider = this.data.datacenter.spec.provider;
    if (this.data.isEditing && datacenter.spec.provider !== oldProvider) {
      datacenter.spec[oldProvider] = null;
    }

    this._matDialogRef.close(datacenter);
  }
}
