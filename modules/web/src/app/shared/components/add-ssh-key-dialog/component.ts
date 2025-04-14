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
import {NON_SPECIAL_CHARACTERS_PATTERN_VALIDATOR} from '@shared/validators/others';
import {SSHKeyFormValidator} from '@shared/validators/ssh-key-form.validator';
import {SSHKeyService} from '@core/services/ssh-key';
import {Observable} from 'rxjs';

enum Controls {
  Name = 'name',
  Key = 'key',
}

@Component({
  selector: 'km-add-ssh-key-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddSshKeyDialogComponent implements OnInit {
  @Input() projectID: string;
  @Input() title = 'Add SSH Key';
  form: FormGroup;
  readonly controls = Controls;

  constructor(
    private _sshKeyService: SSHKeyService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AddSshKeyDialogComponent>,
    public googleAnalyticsService: GoogleAnalyticsService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      [Controls.Name]: ['', [Validators.required, NON_SPECIAL_CHARACTERS_PATTERN_VALIDATOR]],
      [Controls.Key]: ['', [Validators.required, SSHKeyFormValidator()]],
    });
    this.googleAnalyticsService.emitEvent('addSshKey', 'addSshKeyDialogOpened');
  }

  getObservable(): Observable<SSHKey> {
    return this._sshKeyService.add(
      new SSHKey(this.form.get(Controls.Name).value, null, this.form.get(Controls.Key).value),
      this.projectID
    );
  }

  onNext(sshKey: SSHKey): void {
    this.dialogRef.close(sshKey);
    this.googleAnalyticsService.emitEvent('addSshKey', 'sshKeyAdded');
    this._notificationService.success(`Added the ${sshKey.name} SSH key`);
  }

  onNewKeyTextChanged(): void {
    const keyName = this.form.get(Controls.Key).value.match(/^\S+ \S+ (.+)\n?$/);
    if (keyName && keyName.length > 1 && '' === this.form.get(Controls.Name).value) {
      this.form.patchValue({name: keyName[1]});
    }
  }
}
