import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';

import {ApiService, NotificationService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SSHKey} from '../../entity/ssh-key';
import {SSHKeyFormValidator} from '../../validators/ssh-key-form.validator';

@Component({
  selector: 'km-add-ssh-key-dialog',
  templateUrl: './add-ssh-key-dialog.component.html',
  styleUrls: ['./add-ssh-key-dialog.component.scss'],
})
export class AddSshKeyDialogComponent implements OnInit {
  @Input() projectID: string;
  addSSHKeyForm: FormGroup;

  constructor(
    private api: ApiService,
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
    const name = this.addSSHKeyForm.controls['name'].value;
    const key = this.addSSHKeyForm.controls['key'].value;

    this.api.addSSHKey(new SSHKey(name, null, key), this.projectID).subscribe(result => {
      this._notificationService.success(`The <strong>${name}</strong> SSH key was added`);
      this.googleAnalyticsService.emitEvent('addSshKey', 'sshKeyAdded');
      this.dialogRef.close(result);
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
