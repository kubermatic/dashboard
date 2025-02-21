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

import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {NavigationStart, Router} from '@angular/router';
import {NotificationType} from '@core/components/notification/component';
import {Notification, NotificationService} from '@core/services/notification';

import {slideOut} from '@shared/animations/slide';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
    selector: 'km-notification-panel',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    animations: [slideOut],
    standalone: false
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  private _isOpen = false;
  private _filter: NotificationType = undefined;
  private _isAnimating = false;
  private _unsubscribe: Subject<void> = new Subject<void>();
  @ViewChild('toggleButton') toggleButton: MatButton;
  notifications: Notification[] = [];
  unseenNotificationsCount = 0;
  readonly NotificationType = NotificationType;

  constructor(
    private readonly _notificationService: NotificationService,
    private readonly _elementRef: ElementRef,
    private readonly _router: Router
  ) {}

  ngOnInit(): void {
    this._router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.close();
      }
    });

    this._notificationService
      .getNotificationHistory()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(notifications => {
        this.unseenNotificationsCount =
          notifications.length && !this._isOpen
            ? this.unseenNotificationsCount + (notifications.length - this.notifications.length)
            : 0;
        this.notifications = notifications.sort((a, b) => {
          const aDate = new Date(a.timestamp);
          const bDate = new Date(b.timestamp);

          return aDate < bDate ? 1 : aDate > bDate ? -1 : 0;
        });
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (
      this.isOpen() &&
      !this._elementRef.nativeElement.contains(event.target) &&
      this.toggleButton._elementRef.nativeElement !== event.target
    ) {
      this.close();
    }
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  close(): void {
    this._isOpen = false;
  }

  toggle(): void {
    this._isOpen = !this._isOpen;
    this.unseenNotificationsCount = 0;

    if (this._isOpen) {
      this._onOpen();
    }
  }

  isVisible(notification: Notification): boolean {
    return this._filter === undefined || notification.type === this._filter;
  }

  getNotificationCount(): number {
    return this._filter === undefined
      ? this.notifications.length
      : this.notifications.filter(n => this._filter === n.type).length;
  }

  getNotificationIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.success:
        return 'km-icon-check i-12';
      case NotificationType.error:
        return 'km-icon-error';
      default:
        return '';
    }
  }

  switchFiltering(): void {
    switch (this._filter) {
      case NotificationType.error:
        this._filter = NotificationType.success;
        break;
      case NotificationType.success:
        this._filter = undefined;
        break;
      case undefined:
        this._filter = NotificationType.error;
    }
  }

  getFilteringClass(): string {
    switch (this._filter) {
      case NotificationType.error:
        return 'km-error-bg';
      case NotificationType.success:
        return 'km-success-bg';
      case undefined:
        return 'km-hidden';
    }
  }

  clear(): void {
    this._notificationService.clearNotificationHistory();
  }

  isEmpty(): boolean {
    return !this.notifications.length && !this._isAnimating;
  }

  startAnimation(): void {
    this._isAnimating = true;
  }

  finishAnimation(): void {
    this._isAnimating = false;
  }

  private _onOpen(): void {
    this._notificationService.markAllAsRead();
  }
}
