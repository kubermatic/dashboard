import {Component, ElementRef, HostListener, OnInit} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';

import {slideOut} from '../../../shared/animations/slide';
import {NotificationService} from '../../services';
import {Notification} from '../../services/notification/notification.service';
import {NotificationType} from '../notification/notification.component';

@Component({
  selector: 'km-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
  animations: [slideOut],
})
export class NotificationPanelComponent implements OnInit {
  notifications: Notification[] = [];
  private _isOpen = false;
  private _filter: NotificationType = undefined;
  private _isAnimating = false;

  constructor(
      private readonly _notificationService: NotificationService, private readonly _elementRef: ElementRef,
      private readonly _router: Router) {}

  ngOnInit(): void {
    this._router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.close();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this._elementRef.nativeElement.contains(event.target) && this.isOpen()) {
      this.close();
    }
  }

  load_(): void {
    this.notifications = this._notificationService.getNotificationHistory();
  }

  open_(): void {
    this.load_();
    this._notificationService.success(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');
    this._notificationService.error('errrr');
    this._isOpen = true;
  }

  close(): void {
    this._isOpen = false;
  }

  isOpen(): boolean {
    return this._isOpen;
  }

  toggle(): void {
    this.isOpen() ? this.close() : this.open_();
  }

  isVisible(notification: Notification): boolean {
    return this._filter === undefined || notification.type === this._filter;
  }

  getNotificationCount(): number {
    return this._filter === undefined ? this.notifications.length :
                                        this.notifications.filter(n => this._filter === n.type).length;
  }

  getNotificationIconClass(type: NotificationType): string {
    switch (type) {
      case NotificationType.success:
        return 'km-icon-tick';
      case NotificationType.error:
        return 'km-icon-warning';
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
    this.notifications = this._notificationService.getNotificationHistory();
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
}
