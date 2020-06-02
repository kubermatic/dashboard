import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';

export interface DatacenterDataDialogConfig {
  title: string;
  confirmLabel: string;
  // Following field is required only if dialog is used in edit mode.
  datacenter?: DataCenterEntity;
}

@Component({
  selector: 'km-add-admin-dialog',
  templateUrl: './datacenter-data-dialog.component.html',
})
export class DatacenterDataDialogComponent implements OnInit {
  form: FormGroup;

  constructor(
    public _matDialogRef: MatDialogRef<DatacenterDataDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatacenterDataDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(
        this.data.datacenter ? this.data.datacenter.metadata.name : '',
        [Validators.required]
      ),
      provider: new FormControl(
        this.data.datacenter ? this.data.datacenter.spec.provider : '',
        [Validators.required]
      ),
      seed: new FormControl(
        this.data.datacenter ? this.data.datacenter.spec.seed : '',
        [Validators.required]
      ),
      country: new FormControl(
        this.data.datacenter ? this.data.datacenter.spec.country : '',
        [Validators.required]
      ),
      location: new FormControl(
        this.data.datacenter ? this.data.datacenter.spec.location : '',
        [Validators.required]
      ),
      enforcePodSecurityPolicy: new FormControl(
        !!this.data.datacenter &&
          this.data.datacenter.spec.enforcePodSecurityPolicy
      ),
      enforceAuditLogging: new FormControl(
        !!this.data.datacenter && this.data.datacenter.spec.enforceAuditLogging
      ),
    });
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
        enforcePodSecurityPolicy: this.form.controls.enforcePodSecurityPolicy
          .value,
        enforceAuditLogging: this.form.controls.enforceAuditLogging.value,
      },
      seed: false,
    };

    this._matDialogRef.close(datacenter);
  }
}
