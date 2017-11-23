import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../shared/entity/SSHKeyEntity";
import {FormGroup, FormBuilder, Validators, FormControl} from "@angular/forms";
import { InputValidationService } from '../../core/services';

@Component({
  selector: 'kubermatic-add-ssh-key',
  templateUrl: './add-ssh-key.component.html',
  styleUrls: ['./add-ssh-key.component.scss']
})
export class AddSshKeyComponent implements OnInit {
  @Output() syncSshKey = new EventEmitter();
  @Input() sshKeys: Array<SSHKeyEntity> = [];

  public addSSHKeyForm: FormGroup;

  constructor(
    private api: ApiService, 
    private formBuilder: FormBuilder, 
    public inputValidationService: InputValidationService,
    private notificationActions: NotificationActions
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
        .subscribe(result => {
          this.notificationActions.success("Success", `SSH key ${name} added successfully`);
          this.addSSHKeyForm.reset();
          this.syncSshKey.emit();
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
