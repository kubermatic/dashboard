import {Component, OnInit, Output, Input, EventEmitter} from '@angular/core';
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AddSshKeyModalComponent} from "../add-ssh-key-modal/add-ssh-key-modal.component";
import {MdDialog, MdDialogConfig} from '@angular/material';


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
  @Input() selectedSshKeys: string[];
  @Output() syncSshKeys = new EventEmitter();
  @Input() provider: string;

  constructor(private api: ApiService,private formBuilder: FormBuilder, public dialog: MdDialog) { }

  ngOnInit() {
    this.sshKeyForm = this.formBuilder.group({
      ssh_keys: [this.selectedSshKeys, [<any>Validators.required]]
    });
    this.refreshSSHKeys();
  }

  public change(keys) {
    this.syncSshKeys.emit(keys.value);
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().subscribe(result => {
     this.sshKeys = result;
     });
  }

  public addSshKeyDialog(): void {
    var dialogRef = this.dialog.open(AddSshKeyModalComponent, this.config);

    dialogRef.afterClosed().subscribe(result => {
      this.selectedSshKeys.push(result.metadata.name);
      this.refreshSSHKeys();
    });
  }

}
