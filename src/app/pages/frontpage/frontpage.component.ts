import { Component, OnInit } from '@angular/core';
import { Auth } from '../../core/services';
import { Router } from '@angular/router';
import {environment} from '../../../environments/environment';


@Component({
  selector: 'kubermatic-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.scss']
})
export class FrontpageComponent implements OnInit {
  public myStyle: object = {};
  public myParams: object = {};
  public width = 100;
  public height = 100;
  public environment: any = environment;
  public isAuth = false;


  constructor(private auth: Auth, private router: Router) {
  }

  ngOnInit(): void {
    if (this.auth.authenticated()) {
      this.router.navigate(['clusters']);
      this.isAuth = true;
    }

    this.myStyle = {
      'position': 'fixed',
      'width': '100%',
      'height': '100%',
      'z-index': 0,
      'top': 0,
      'left': 0,
      'right': 0,
      'bottom': 0,
    };

    this.myParams = {
      particles: {
        number: {
          value: 100,
        },
        color: {
          value: '#fff'
        },
        shape: {
          type: 'circle',
        },
      }
    };
  }
}
