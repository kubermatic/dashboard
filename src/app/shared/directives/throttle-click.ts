import {Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {throttleTime} from 'rxjs/operators';

@Directive({
  selector: '[kmThrottleClick]',
})
export class ThrottleClickDirective implements OnInit, OnDestroy {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  @Input() throttleTime = 500;
  @Output() throttleClick = new EventEmitter();
  private _clicks = new Subject();
  private _subscription: Subscription;

  ngOnInit(): void {
    this._subscription = this._clicks
      .pipe(throttleTime(this.throttleTime))
      .subscribe(res => this.throttleClick.emit(res));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  @HostListener('click', ['$event'])
  clickEvent(event): void {
    event.preventDefault();
    event.stopPropagation();
    this._clicks.next(event);
  }
}
