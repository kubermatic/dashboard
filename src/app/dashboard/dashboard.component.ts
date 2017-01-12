import { Component, OnInit } from "@angular/core";
import {Auth} from "../auth/auth.service";

@Component({
  selector: "kubermatic-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit {

  constructor(private auth: Auth) {

  }

  ngOnInit() {
  }
}
