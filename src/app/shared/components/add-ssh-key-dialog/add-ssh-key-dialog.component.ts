import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {SSHKeyEntity} from '../../entity/SSHKeyEntity';
import {SSHKeyFormValidator} from '../../validators/ssh-key-form.validator';

@Component({
  selector: 'kubermatic-add-ssh-key-dialog',
  templateUrl: './add-ssh-key-dialog.component.html',
  styleUrls: ['./add-ssh-key-dialog.component.scss'],
})
export class AddSshKeyDialogComponent implements OnInit {
  @Input() projectID: string;
  addSSHKeyForm: FormGroup;

  constructor(
      private api: ApiService, private formBuilder: FormBuilder,
      private dialogRef: MatDialogRef<AddSshKeyDialogComponent>,
      public googleAnalyticsService: GoogleAnalyticsService) {}

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

    this.api.addSSHKey(new SSHKeyEntity(name, null, key), this.projectID).subscribe((result) => {
      NotificationActions.success(`SSH key ${name} added successfully to project`);
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
