// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {DOCUMENT} from '@angular/common';
import {AfterViewInit, Component, Inject} from '@angular/core';
import {MatLegacySnackBarRef as MatSnackBarRef} from '@angular/material/legacy-snack-bar';

export enum NotificationType {
  success,
  error,
}

@Component({
  selector: 'km-notification',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class NotificationComponent implements AfterViewInit {
  private _snackBarRef: MatSnackBarRef<NotificationComponent>;
  private _type: NotificationType;

  set snackBarRef(ref: MatSnackBarRef<NotificationComponent>) {
    this._snackBarRef = ref;
  }

  set type(type: NotificationType) {
    this._type = type;
    this._init();
  }

  message: string;
  typeIconBackground: string;
  typeIconClassName: string;

  constructor(@Inject(DOCUMENT) private readonly _document: Document) {}

  ngAfterViewInit(): void {
    // As there is no other way to style wrapping overlay container
    // element we need to get it this way and add a style class manually.
    // It makes sure that the invisible spacing surrounding the notification
    // does not block the access to the underlying elements.
    const overlayElement = this._document.body.querySelector('.cdk-overlay-pane > .km-notification')?.parentElement;

    if (overlayElement) {
      overlayElement.classList.add('km-notification-overlay');
    }
  }

  private _init(): void {
    switch (this._type) {
      case NotificationType.success:
        this.typeIconBackground = 'success';
        this.typeIconClassName = 'km-icon-mask-white km-icon-check';
        break;
      case NotificationType.error:
        this.typeIconBackground = 'error';
        this.typeIconClassName = 'km-icon-error';
    }
  }

  dismiss(): void {
    this._snackBarRef.dismiss();
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.message);
  }
}
