import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { ApiService } from '../../../core/services';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { SSHKeyEntity } from '../../entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-add-ssh-key-modal',
  templateUrl: './add-ssh-key-modal.component.html',
  styleUrls: ['./add-ssh-key-modal.component.scss']
})
export class AddSshKeyModalComponent implements OnInit {
  @Input() projectID: string;
  public addSSHKeyForm: FormGroup;

  constructor(private api: ApiService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<AddSshKeyModalComponent>,
    public googleAnalyticsService: GoogleAnalyticsService) { }

  ngOnInit(): void {
    this.addSSHKeyForm = this.formBuilder.group({
      name: ['', [<any> Validators.required]],
      key: ['', [<any> Validators.required]],
    });
    this.googleAnalyticsService.emitEvent('addSshKey', 'addSshKeyDialogOpened');
  }

  public addSSHKey(): void {
    const name = this.addSSHKeyForm.controls['name'].value;
    const key = this.addSSHKeyForm.controls['key'].value;

    this.api.addSSHKey(new SSHKeyEntity(name, null, key), this.projectID)
      .subscribe(
        result => {
          NotificationActions.success('Success', `SSH key ${name} added successfully to project`);
          this.googleAnalyticsService.emitEvent('addSshKey', 'sshKeyAdded');
          this.dialogRef.close(result);
        });
  }

  public onNewKeyTextChanged(): void {
    const name = this.addSSHKeyForm.controls['name'].value;
    const key = this.addSSHKeyForm.controls['key'].value;
    const keyName = key.match(/^\S+ \S+ (.+)\n?$/);

    if (keyName && keyName.length > 1 && '' === name) {
      this.addSSHKeyForm.patchValue({ name: keyName[1] });
    }
  }

}
