import {Component, ElementRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private _isOpen = false;
  private _filter: NotificationType = undefined;
  private _isAnimating = false;
  private _unsubscribe: Subject<any> = new Subject();

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
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: Event): void {
    if (!this._elementRef.nativeElement.contains(event.target) && this.isOpen()) {
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
