import {Component, OnInit} from "@angular/core";
import {ApiService} from "../api/api.service";
import {SSHKeyEntity} from "../api/entitiy/SSHKeyEntity";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {NotificationComponent} from "../notification/notification.component";

@Component({
  selector: "kubermatic-sshkey",
  templateUrl: "sshkey.component.html",
  styleUrls: ["sshkey.component.scss"]
})

export class SshkeyComponent implements OnInit {

  public sshKeys: Array<SSHKeyEntity> = [];
  public loading: boolean = true;

  constructor(private api: ApiService, private store: Store<fromRoot.State>) {}

  ngOnInit() {
    this.refreshSSHKeys();
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().retry(3)
      .subscribe(
        result => {
          this.sshKeys = result;
          this.loading = false;
        }, 
        error => this.loading = false
      );
  }

  public handleKeyUpdated() {
    this.refreshSSHKeys();
  }
}
