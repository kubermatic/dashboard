import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import {NotificationComponent} from "../../notification/notification.component";
import {MdDialogRef} from '@angular/material';
import { InputValidationService } from '../../services';

@Component({
  selector: 'kubermatic-add-ssh-key-modal',
  templateUrl: './add-ssh-key-modal.component.html',
  styleUrls: ['./add-ssh-key-modal.component.scss']
})
export class AddSshKeyModalComponent implements OnInit {
  @Input() sshKeys: Array<SSHKeyEntity> = [];
  //@Output() newSshKey = new EventEmitter();
  public addSSHKeyForm: FormGroup;

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private store: Store<fromRoot.State>,
    private dialogRef: MdDialogRef<AddSshKeyModalComponent>,
    public inputValidationService: InputValidationService
  ) {}

  ngOnInit() {
    this.addSSHKeyForm = this.formBuilder.group({
      name: ["", [<any>Validators.required]],
      key: ["", [<any>Validators.required]],
    });
  }

  public addSSHKey(): void {
    const name = this.addSSHKeyForm.controls["name"].value;
    const key = this.addSSHKeyForm.controls["key"].value;

    this.api.addSSHKey(new SSHKeyEntity(name, null, key))
      .subscribe(
        result => {
          NotificationComponent.success(this.store, "Success", `SSH key ${name} added successfully`);
          //this.newSshKey.emit(result.metadata.name)
          this.dialogRef.close(result);
        });
  }

  public onNewKeyTextChanged() {
    const name = this.addSSHKeyForm.controls["name"].value;
    const key = this.addSSHKeyForm.controls["key"].value;
    const keyName = key.match(/^\S+ \S+ (.+)\n?$/);

    if (keyName && keyName.length > 1 && "" === name) {
      this.addSSHKeyForm.patchValue({name: keyName[1]});
    }
  }

}
