import { Observable } from 'rxjs';
import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { ApiService } from "app/core/services/api/api.service";
import { SSHKeyEntity } from "../../shared/entity/SSHKeyEntity";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AddSshKeyModalComponent } from "../add-ssh-key-modal/add-ssh-key-modal.component";
import { MdDialog, MdDialogConfig } from '@angular/material';
import { select } from '@angular-redux/store/lib/src/decorators/select';


@Component({
  selector: 'kubermatic-ssh-key-form-field',
  templateUrl: './ssh-key-form-field.component.html',
  styleUrls: ['./ssh-key-form-field.component.scss']
})
export class SshKeyFormFieldComponent implements OnInit {

  public sshKeys: SSHKeyEntity[] = [];
  public config: MdDialogConfig = {};
  public selectedCloudProviderApiError: string;
  public sshKeyForm: FormGroup;

  @select(['wizard', 'sshKeyForm', 'ssh_keys']) selectedSshKeys$: Observable<string[]>;  
  public selectedSshKeys: string[] = [];

  constructor(private api: ApiService, private formBuilder: FormBuilder, public dialog: MdDialog) { }

  ngOnInit() {
    this.selectedSshKeys$.subscribe(selectedSshKeys => {
      this.selectedSshKeys = selectedSshKeys;
    });

    this.sshKeyForm = this.formBuilder.group({
      ssh_keys: [this.selectedSshKeys, [<any>Validators.required]]
    });
  
    this.refreshSSHKeys();
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().subscribe(result => {
     this.sshKeys = result;
     });
  }

  public addSshKeyDialog(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent, this.config);

    dialogRef.afterClosed().subscribe(result => {
      this.selectedSshKeys.push(result.metadata.name);
      this.refreshSSHKeys();
    });
  }

}
