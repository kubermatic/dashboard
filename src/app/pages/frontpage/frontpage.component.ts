import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {Auth} from '../../core/services';

@Component({
  selector: 'kubermatic-frontpage',
  templateUrl: './frontpage.component.html',
  styleUrls: ['./frontpage.component.scss'],
})
export class FrontpageComponent implements OnInit, AfterViewInit {
  myStyle: object = {
    'position': 'fixed',
    'width': '100%',
    'height': '100%',
    'z-index': 0,
    'top': 0,
    'left': 0,
    'right': 0,
    'bottom': 0,
  };

  myParams: object = {
    particles: {
      number: {
        value: 100,
      },
      color: {
        value: '#fff',
      },
      shape: {
        type: 'circle',
      },
    },
  };

  isInitialized = false;
  environment: any = environment;
  isAuth = false;

  constructor(private auth: Auth, private router: Router) {}

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent): void {
    // keyCode = 13 is enter
    if (event.keyCode === 13) {
      this.goToLogin();
    }
  }

  ngOnInit(): void {
    if (this.auth.authenticated()) {
      this.router.navigate(['/projects']);
      this.isAuth = true;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Displaying of particles has to be delayed to avoid race condition and component crash.
      // It was introduced after APP_INITIALIZER was added to the ApiService.
      this.isInitialized = true;
    });
  }

  goToLogin(): void {
    document.getElementById('login-button').click();
  }
}
