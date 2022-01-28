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

import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {NotificationService} from '@core/services/notification';
import {SSHKey} from '@shared/entity/ssh-key';
import {SSHKeyFormValidator} from '@shared/validators/ssh-key-form.validator';
import {SSHKeyService} from '@core/services/ssh-key';

@Component({
  selector: 'km-add-ssh-key-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddSshKeyDialogComponent implements OnInit {
  @Input() projectID: string;
  @Input() title = 'Add SSH Key';
  addSSHKeyForm: FormGroup;

  constructor(
    private _sshKeyService: SSHKeyService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AddSshKeyDialogComponent>,
    public googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.addSSHKeyForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required, SSHKeyFormValidator()]],
    });
    this.googleAnalyticsService.emitEvent('addSshKey', 'addSshKeyDialogOpened');
  }

  addSSHKey(): void {
    if (!this.addSSHKeyForm.valid) {
      return;
    }

    const name = this.addSSHKeyForm.controls['name'].value;
    const key = this.addSSHKeyForm.controls['key'].value;

    this._sshKeyService.add(new SSHKey(name, null, key), this.projectID).subscribe(result => {
      this.dialogRef.close(result);
      this.googleAnalyticsService.emitEvent('addSshKey', 'sshKeyAdded');
      this._notificationService.success(`Added the ${name} SSH key`);
    });
  }

  onNewKeyTextChanged(): void {
    const name = this.addSSHKeyForm.controls['name'].value;
    const key = this.addSSHKeyForm.controls['key'].value;
    const keyName = key.match(/^\S+ \S+ (.+)\n?$/);

    if (keyName && keyName.length > 1 && '' === name) {
      this.addSSHKeyForm.patchValue({name: keyName[1]});
    }
  }
}
