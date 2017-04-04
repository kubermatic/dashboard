import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import {NotificationComponent} from "../../notification/notification.component";

@Component({
  selector: 'kubermatic-add-ssh-key',
  templateUrl: './add-ssh-key.component.html',
  styleUrls: ['./add-ssh-key.component.scss']
})
export class AddSshKeyComponent implements OnInit {
  @Output() syncSshKey = new EventEmitter();
  @Input() sshKeys: Array<SSHKeyEntity> = [];
  public userProfile: any;

  public addSSHKeyForm: FormGroup;

  constructor(private api: ApiService, private formBuilder: FormBuilder, private store: Store<fromRoot.State>) {
    this.store.select(fromRoot.getAuthProfile).subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngOnInit() {
    this.addSSHKeyForm = this.formBuilder.group({
      name: ["", [<any>Validators.required, Validators.pattern("[\\w\\d-]+")]],
      key: ["", [<any>Validators.required]],
    });
  }

  public addSSHKey(): void {
    const name = this.addSSHKeyForm.controls["name"].value;
    const key = this.addSSHKeyForm.controls["key"].value;



    this.api.addSSHKey(new SSHKeyEntity(name, null, key))
        .subscribe(result => {
              NotificationComponent.success(this.store, "Success", `SSH key ${name} added successfully`);
              this.addSSHKeyForm.reset();
              this.syncSshKey.emit();
            },
            error => {
              NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);
            });
  }

  public onNewKeyTextChanged() {
    const name = this.addSSHKeyForm.controls["name"].value;
    const key = this.addSSHKeyForm.controls["key"].value;
    const keyName = key.match(/^\S+ \S+ (.+)\n?$/);

    if (keyName && keyName.length > 1 && "" === name) {
      this.addSSHKeyForm.patchValue({name: keyName[1]});
    }

    console.log(this.addSSHKeyForm);
  }
}
