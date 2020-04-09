import {DOCUMENT} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import * as SwaggerUI from 'swagger-ui';

import {ApiService, Auth} from '../../core/services';

@Component({
  selector: 'km-api-docs',
  templateUrl: './api-docs.component.html',
  styleUrls: ['./api-docs.component.scss'],
})
export class ApiDocsComponent implements OnInit {
  constructor(
      private readonly _auth: Auth, private readonly _api: ApiService, private readonly _router: Router,
      @Inject(DOCUMENT) private readonly _document: Document) {}

  ngOnInit(): void {
    this._api.getSwaggerJson().subscribe((swaggerSpec) => {
      swaggerSpec.host = this._document.location.host;
      swaggerSpec.schemes = [this._document.location.protocol.replace(':', '')];
      SwaggerUI({
        dom_id: '#km-swagger-container',
        spec: swaggerSpec,
        requestInterceptor: (req) => {
          const token = this._auth.getBearerToken();
          req.headers.authorization = 'Bearer ' + token;
          return req;
        }
      });
    });
  }

  backToApp(): void {
    if (this._auth.authenticated()) {
      this._router.navigate(['/projects']);
    } else {
      this._router.navigate(['']);
    }
  }
}
