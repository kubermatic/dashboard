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

import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig, MatSnackBarDismiss} from '@angular/material/snack-bar';
import {BehaviorSubject, Observable} from 'rxjs';
import {delay, filter, map, take, tap} from 'rxjs/operators';
import {NotificationComponent, NotificationType} from '../components/notification/component';

export interface Notification {
  message: string;
  shortMessage?: string;
  type: NotificationType;
  timestamp: string;
  beingDispatched: boolean;
  unread: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _config: MatSnackBarConfig = {
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: 'km-notification',
  };

  private readonly _notificationPopDelay = 250;
  private readonly _snackBarQueue = new BehaviorSubject<Notification[]>([]);
  private readonly _notificationHistory = new BehaviorSubject<Notification[]>([]);

  constructor(private readonly _snackBar: MatSnackBar) {
    /* Dispatches all queued snack bars one by one */
    this._snackBarQueue
      .asObservable()
      .pipe(filter(queue => queue.length > 0 && !queue[0].beingDispatched))
      .pipe(
        tap(() => {
          const updatedQueue = this._snackBarQueue.value;
          updatedQueue[0].beingDispatched = true;
          this._snackBarQueue.next(updatedQueue);
        })
      )
      .pipe(map(queue => queue[0]))
      .subscribe(snackBarItem => this._open(snackBarItem.message, snackBarItem.shortMessage, snackBarItem.type));
  }

  success(message: string): void {
    this._pushNotification(NotificationType.success, message);
  }

  error(message: string, shortMessage?: string): void {
    this._pushNotification(NotificationType.error, message, shortMessage);
  }

  getNotificationHistory(): Observable<Notification[]> {
    return this._notificationHistory.asObservable();
  }

  clearNotificationHistory(): void {
    this._notificationHistory.next([]);
  }

  markAllAsRead(): void {
    this._notificationHistory.next(
      this._notificationHistory.value.map(n => {
        n.unread = false;
        return n;
      })
    );
  }

  private _open(message: string, shortMessage: string, type: NotificationType): void {
    const snackBarRef = this._snackBar.openFromComponent(NotificationComponent, this._config);

    snackBarRef.instance.message = message;
    snackBarRef.instance.shortMessage = shortMessage;
    snackBarRef.instance.snackBarRef = snackBarRef;
    snackBarRef.instance.type = type;

    this.popNotification(snackBarRef.afterDismissed());
  }

  private popNotification(dismissed: Observable<MatSnackBarDismiss>): void {
    dismissed
      .pipe(delay(this._notificationPopDelay))
      .pipe(take(1))
      .subscribe(() => {
        const updatedQueue = this._snackBarQueue.value;
        if (updatedQueue[0].beingDispatched) {
          updatedQueue.shift();
        }
        this._snackBarQueue.next(updatedQueue);
      });
  }

  private _pushNotification(type: NotificationType, message: string, shortMessage?: string): void {
    const notification: Notification = {
      message,
      shortMessage,
      type,
      timestamp: new Date().toUTCString(),
      beingDispatched: false,
      unread: true,
    };

    if (this._isUnique(message)) {
      // Update timestamp of repeating notification.
      this._notificationHistory.next(
        this._notificationHistory.value.filter(n => n.message !== message).concat(notification)
      );
      this._snackBarQueue.next(this._snackBarQueue.value.concat([notification]));
    }
  }

  private _isUnique(message: string): boolean {
    return !this._snackBarQueue.value.find(n => n.message === message);
  }
}
