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

  constructor(private api: ApiService, private formBuilder: FormBuilder, private store: Store<fromRoot.State>) {
    this.store.select(fromRoot.getAuthProfile).subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngOnInit() {
  }


  public selectTabProfileDetail(): void {
    this.currentTab = 0;
  }

  public selectTabSSHKeys(): void {
    this.currentTab = 1;
  }

}
