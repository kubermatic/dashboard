import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Config } from './shared/model/Config';
import { NotificationActions } from './redux/actions/notification.actions';
import { environment } from '../environments/environment';

@Injectable()
export class AppConfigService {
  private appConfig: Config;
  private http: HttpClient;

  constructor(private inj: Injector) {
    setTimeout(() => {
      this.http = this.inj.get(HttpClient);
    });
  }

  loadAppConfig() {
    const jsonfile = '../assets/config/appConfig.' + environment.name + '.json';
    setTimeout(() => {
      return this.http.get(jsonfile).toPromise().then(resp => {
        this.appConfig = <Config>resp;
      }).catch(error => {
        NotificationActions.error('Error', `Could not read configuration file`);
      });
    });
  }

  getConfig() {
    return this.appConfig;
  }
}
