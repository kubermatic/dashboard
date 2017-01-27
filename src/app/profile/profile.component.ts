import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";
import {SSHKeyEntity} from "../api/entitiy/SSHKeyEntity";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";

@Component({
  selector: "kubermatic-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {

  public sshKeys: Array<SSHKeyEntity> = [];
  public addSSHKeyForm: FormGroup;
  public addSSHKeyResult: any;
  public deleteSSHKeyResult: any;

  constructor(private api: ApiService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.refreshSSHKeys();

    this.addSSHKeyForm = this.formBuilder.group({
      name: ["", [<any>Validators.required, Validators.pattern("[\w\d-]+")]],
      key: ["", [<any>Validators.required]],
    });
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });
  }

  public deleteSSHKey(name): void {
    let index = -1;

    this.sshKeys.forEach((key, i) => {
      if (key.name === name) {
        index = i;
      }
    });

    if (index > -1) {
      this.api.deleteSSHKey(name)
        .subscribe(result => {
            this.sshKeys.splice(index, 1);
            this.deleteSSHKeyResult = {
              title: "Success",
              error: false,
              message: `SSH key ${name} deleted.`
            };
          },
          error => {
            this.deleteSSHKeyResult = {
              title: "Error",
              error: true,
              message: `SSH key ${name} could not be deleted. Error: ` + error
            };
          });
    } else {
      this.deleteSSHKeyResult = {
        title: "Error",
        error: true,
        message: `Error deleting SSH key ${name}. Please try again.`
      };
    }
  }

  public addSSHKey(): void {
    const name = this.addSSHKeyForm.controls["name"].value;
    const key = this.addSSHKeyForm.controls["key"].value;

    this.api.addSSHKey(new SSHKeyEntity(name, null, key))
      .subscribe(result => {
          this.addSSHKeyResult = {
            title: "Success",
            error: false,
            message: `SSH key ${name} added successfully`
          };

          this.addSSHKeyForm.reset();
          this.sshKeys.push(result);
        },
        error => {
          this.addSSHKeyResult = {
            title: "Error",
            error: true,
            message: error.status + " " + error.statusText
          };
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
