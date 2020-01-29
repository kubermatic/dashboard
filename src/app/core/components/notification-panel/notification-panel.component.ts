import {Component, ElementRef, HostListener, OnInit} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';

import {slideOut} from '../../../shared/animations/slide';
import {NotificationService} from '../../services';
import {Notification} from '../../services/notification/notification.service';

@Component({
  selector: 'km-notification-panel',
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
  animations: [slideOut],
})
export class NotificationPanelComponent implements OnInit {
  notifications: Notification[] = [];
  private _isOpen = false;
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
    this._notificationService.success('opened');
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
