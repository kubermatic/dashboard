import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";

@Component({
  selector: "kubermatic-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"]
})
export class ProfileComponent implements OnInit {

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getSSHKeys().subscribe(result => {
      console.log(JSON.stringify(result));
    });
  }

}
