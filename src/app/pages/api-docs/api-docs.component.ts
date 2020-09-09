// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DOCUMENT} from '@angular/common';
import {Component, Inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import * as SwaggerUI from 'swagger-ui';

import {ApiService, Auth} from '../../core/services';

@Component({
  selector: 'km-api-docs',
  templateUrl: './api-docs.component.html',
})
export class ApiDocsComponent implements OnInit {
  constructor(
    private readonly _auth: Auth,
    private readonly _api: ApiService,
    private readonly _router: Router,
    @Inject(DOCUMENT) private readonly _document: Document
  ) {}

  ngOnInit(): void {
    this._api.getSwaggerJson().subscribe(swaggerSpec => {
      swaggerSpec.host = this._document.location.host;
      swaggerSpec.schemes = [this._document.location.protocol.replace(':', '')];
      SwaggerUI({
        dom_id: '#km-swagger-container',
        spec: swaggerSpec,
        requestInterceptor: req => {
          const token = this._auth.getBearerToken();
          req.headers.authorization = 'Bearer ' + token;
          return req;
        },
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
