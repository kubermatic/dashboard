import {Component, OnInit} from "@angular/core";
import {ApiService} from "../api/api.service";
import {SSHKeyEntity} from "../api/entitiy/SSHKeyEntity";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {NotificationComponent} from "../notification/notification.component";

@Component({
  selector: "kubermatic-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {

  public currentTab: number = 0;
  public userProfile: any;
  public sshKeys: Array<SSHKeyEntity> = [];
  public addSSHKeyForm: FormGroup;

  constructor(private api: ApiService, private formBuilder: FormBuilder, private store: Store<fromRoot.State>) {
    this.store.select(fromRoot.getAuthProfile).subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngOnInit() {
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });
  }

  public selectTabProfileDetail(): void {
    this.currentTab = 0;
  }

  public selectTabSSHKeys(): void {
    this.currentTab = 1;
  }

  public deleteSSHKey(name): void {
    let index = -1;
    let fingerprint = "";

    this.sshKeys.forEach((key, i) => {
      if (key.name === name) {
        index = i;
        fingerprint = key.fingerprint.replace(":", "");
      }
    });

    if (index > -1) {
      this.api.deleteSSHKey(fingerprint)
        .subscribe( () => {
            this.sshKeys.splice(index, 1);
            NotificationComponent.success(this.store, "Success", `SSH key ${name} deleted.`);
          },
          error => {
            NotificationComponent.error(this.store, "Error",  `SSH key ${name} could not be deleted. Error: ${error}`);
          });
    } else {
      NotificationComponent.error(this.store, "Error", `Error deleting SSH key ${name}. Please try again.`);
    }
  }
}
