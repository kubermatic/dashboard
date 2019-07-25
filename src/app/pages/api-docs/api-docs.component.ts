import {Component, OnInit} from '@angular/core';
import SwaggerUI from 'swagger-ui';
import {ApiService, Auth} from '../../core/services';

@Component({
  selector: 'kubermatic-api-docs',
  templateUrl: './api-docs.component.html',
})
export class ApiDocsComponent implements OnInit {
  constructor(private _auth: Auth, private _api: ApiService) {}

  ngOnInit(): void {
    this._api.getSwaggerJson().subscribe((swaggerSpec) => {
      swaggerSpec.host = window.location.host;
      swaggerSpec.schemes = [window.location.protocol.replace(':', '')];
      SwaggerUI({
        dom_id: '#swaggerContainer',
        spec: swaggerSpec,
        requestInterceptor: (req) => {
          const token = this._auth.getBearerToken();
          req.headers.authorization = 'Bearer ' + token;
          return req;
        }
      });
    });
  }
}
