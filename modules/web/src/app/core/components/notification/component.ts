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

  readonly headlineMaxLength = 38;
  readonly messageMaxLength = 128;

  set snackBarRef(ref: MatSnackBarRef<NotificationComponent>) {
    this._snackBarRef = ref;
  }

  set type(type: NotificationType) {
    this._type = type;
    this._init();
  }

  message: string;
  shortMessage: string;
  typeIconClassName: string;
  isMessageCollapsed = true;

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

  showMessageSection(): boolean {
    return !!(this.message && (this.shortMessage || this._type === NotificationType.error));
  }

  hasLongMessage(): boolean {
    return this.message?.length > this.messageMaxLength;
  }

  getHeadline(): string {
    if (this.shortMessage) {
      return this.shortMessage.length > this.headlineMaxLength
        ? `${this.shortMessage.slice(0, this.headlineMaxLength)}...`
        : this.shortMessage;
    } else if (this._type === NotificationType.error) {
      return 'Something went wrong.';
    }
    return this.hasLongMessage() ? `${this.message?.slice(0, this.messageMaxLength)}...` : this.message;
  }

  dismiss(): void {
    this._snackBarRef.dismiss();
  }

  copyHeadlineToClipboard(): void {
    navigator.clipboard.writeText(this.shortMessage || this.message);
  }

  copyMessageToClipboard(): void {
    navigator.clipboard.writeText(this.message);
  }

  private _init(): void {
    switch (this._type) {
      case NotificationType.success:
        this.typeIconClassName = 'km-icon-notification-success';
        break;
      case NotificationType.error:
        this.typeIconClassName = 'km-icon-notification-error';
        break;
    }
  }
}
