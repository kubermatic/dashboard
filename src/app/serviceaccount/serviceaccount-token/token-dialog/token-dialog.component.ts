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

import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ServiceAccountToken} from '../../../shared/entity/service-account';

@Component({
  selector: 'km-token-dialog',
  templateUrl: './token-dialog.component.html',
  styleUrls: ['./token-dialog.component.scss'],
})
export class TokenDialogComponent implements OnInit {
  @Input() serviceaccountToken: ServiceAccountToken;
  @Input() projectID: string;
  downloadUrl: SafeUrl;
  downloadTitle = '';

  constructor(public dialogRef: MatDialogRef<TokenDialogComponent>, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    const blob = new Blob([this.serviceaccountToken.token], {
      type: 'text/plain',
    });
    this.downloadUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(blob));
    this.downloadTitle = window.location.host + '-' + this.projectID + '-' + this.serviceaccountToken.name;
  }
}
