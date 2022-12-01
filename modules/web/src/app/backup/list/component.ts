// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {View} from '@app/shared/entity/common';

@Component({
  selector: 'km-backups',
  templateUrl: './template.html',
})
export class BackupsComponent implements OnInit {
  readonly view = View;
  etcdBackupType = '';

  constructor(private _router: Router) {}

  ngOnInit(): void {
    this.getEtcdBackupType();
  }

  getEtcdBackupType(): void {
    const urlArray = this._router.routerState.snapshot.url.split('/');
    this.etcdBackupType = urlArray[urlArray.length - 1];
  }
}
