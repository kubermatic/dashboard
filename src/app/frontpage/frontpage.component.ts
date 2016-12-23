import { Component } from "@angular/core";
import {Auth} from "../auth/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: "kubermatic-frontpage",
  templateUrl: "./frontpage.component.html",
  styleUrls: ["./frontpage.component.scss"]
})
export class FrontpageComponent {

  constructor(private auth: Auth, private router: Router) {
  }

  public gotoDashboard() {
    if (this.auth.authenticated()) {
      this.router.navigate(["dashboard/wizard"]);
    } else {
      localStorage.setItem("redirect_url", "dashboard/wizard");
      this.auth.login();
    }
  }
}
