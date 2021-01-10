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

import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig, MatSnackBarDismiss} from '@angular/material/snack-bar';
import {BehaviorSubject, Observable} from 'rxjs';
import {delay, filter, map, take, tap} from 'rxjs/operators';
import {NotificationComponent, NotificationType} from '../../components/notification/component';

export interface Notification {
  message: string;
  type: NotificationType;
  timestamp: string;
  beingDispatched: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _config: MatSnackBarConfig = {
    duration: 99999,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: 'km-notification',
  };

  private readonly _notificationPopDelay = 250; // in ms
  private readonly snackBarQueue = new BehaviorSubject<Notification[]>([]);
  private _notificationHistory = new BehaviorSubject<Notification[]>([]);

  constructor(private readonly _snackBar: MatSnackBar) {
    /* Dispatches all queued snack bars one by one */
    this.snackBarQueue
      .asObservable()
      .pipe(filter(queue => queue.length > 0 && !queue[0].beingDispatched))
      .pipe(
        tap(() => {
          const updatedQueue = this.snackBarQueue.value;
          updatedQueue[0].beingDispatched = true;
          this.snackBarQueue.next(updatedQueue);
        })
      )
      .pipe(map(queue => queue[0]))
      .subscribe(snackBarItem => this._open(snackBarItem.message, snackBarItem.type));
  }

  success(message: string): void {
    this._pushNotification(message, NotificationType.success);
  }

  error(message: string): void {
    this._pushNotification(message, NotificationType.error);
  }

  getNotificationHistory(): Observable<Notification[]> {
    return this._notificationHistory.asObservable();
  }

  clearNotificationHistory(): void {
    this._notificationHistory.next([]);
  }

  private _open(message: string, type: NotificationType): void {
    const snackBarRef = this._snackBar.openFromComponent(NotificationComponent, this._config);

    snackBarRef.instance.message = message;
    snackBarRef.instance.snackBarRef = snackBarRef;
    snackBarRef.instance.type = type;

    this.popNotification(snackBarRef.afterDismissed());
  }

  private popNotification(dismissed: Observable<MatSnackBarDismiss>): void {
    dismissed
      .pipe(delay(this._notificationPopDelay))
      .pipe(take(1))
      .subscribe(() => {
        const updatedQueue = this.snackBarQueue.value;
        if (updatedQueue[0].beingDispatched) {
          updatedQueue.shift();
        }
        this.snackBarQueue.next(updatedQueue);
      });
  }

  private _pushNotification(message: string, type: NotificationType): void {
    const notification: Notification = {
      message,
      type,
      timestamp: new Date().toUTCString(),
      beingDispatched: false,
    };

    if (this._isUnique(message)) {
      // Update timestamp of repeating notification.
      this._notificationHistory.next(
        this._notificationHistory.value.filter(n => n.message !== message).concat(notification)
      );
      this.snackBarQueue.next(this.snackBarQueue.value.concat([notification]));
    }
  }

  private _isUnique(message: string): boolean {
    return !this.snackBarQueue.value.find(n => n.message === message);
  }
}
