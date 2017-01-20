import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";
import {SSHKeyEntity} from "../api/entitiy/SSHKeyEntity";

@Component({
  selector: "kubermatic-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {

  private sshKeys: SSHKeyEntity[];

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });
  }

}
