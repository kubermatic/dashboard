import {Component, OnInit} from "@angular/core";
import {Auth} from "../core/services";
import {Router} from "@angular/router";

@Component({
  selector: "kubermatic-frontpage",
  templateUrl: "./frontpage.component.html",
  styleUrls: ["./frontpage.component.scss"]
})
export class FrontpageComponent implements OnInit {

  constructor(private auth: Auth, private router: Router) {
  }

  ngOnInit(): void {
    if (this.auth.authenticated()) {
      this.router.navigate(["clusters"]);
    }
  }
}
