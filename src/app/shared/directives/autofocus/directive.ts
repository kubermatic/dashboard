import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[kmAutofocus]',
})
export class AutofocusDirective implements AfterViewInit, OnDestroy {
  @Input() opened: EventEmitter<boolean>;

  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _el: ElementRef) {}

  ngAfterViewInit(): void {
    if (!this.opened) {
      throw new Error('[opened] event binding is undefined');
    }

    this.opened.pipe(takeUntil(this._unsubscribe)).subscribe(opened => {
      if (opened) {
        setTimeout(() => this._el.nativeElement.focus());
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
