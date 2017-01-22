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

  public sshKeys: SSHKeyEntity[];
  public addSSHKeyForm: FormGroup;
  public addSSHKeyResult: any;

  constructor(private api: ApiService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });

    this.addSSHKeyForm = this.formBuilder.group({
      name: ["", [<any>Validators.required]],
      key: ["", [<any>Validators.required]],
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
          console.log(`SSH key with fingerprint ${name} deleted`);
          this.sshKeys.splice(index, 1);
        },
        error => {
          console.log(`SSH key with fingerprint ${name} could not be deleted. Error: ` + error);
        });
    } else {
      console.log(`No SSH key found with fingerprint ${name} !`);
    }
  }

  public addSSHKey(): void {
    const name = this.addSSHKeyForm.controls["name"].value;
    const key = this.addSSHKeyForm.controls["key"].value;
    console.log("Adding ssh key: " + JSON.stringify(this.addSSHKeyForm));

    this.api.addSSHKey(new SSHKeyEntity(name, null, key))
      .subscribe(result => {
          this.addSSHKeyResult = {
            title: "Success",
            error: false,
            message: `SSH key ${name} added successfully`
          };

          this.addSSHKeyForm.reset();
        },
        error => {
          this.addSSHKeyResult = {
            title: "Error",
            error: true,
            message: error.status + " " + error.statusText
          };
        });
  }
}
