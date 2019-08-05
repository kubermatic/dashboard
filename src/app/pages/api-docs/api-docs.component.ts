import {DOCUMENT} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import SwaggerUI from 'swagger-ui';

import {ApiService, Auth} from '../../core/services';

@Component({
  selector: 'kubermatic-api-docs',
  templateUrl: './api-docs.component.html',
  styleUrls: ['./api-docs.component.scss'],
})
export class ApiDocsComponent implements OnInit {
  constructor(
      private readonly _auth: Auth, private readonly _api: ApiService,
      @Inject(DOCUMENT) private readonly _document: Document) {}

  ngOnInit(): void {
    this._api.getSwaggerJson().subscribe((swaggerSpec) => {
      swaggerSpec.host = this._document.location.host;
      swaggerSpec.schemes = [this._document.location.protocol.replace(':', '')];
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
