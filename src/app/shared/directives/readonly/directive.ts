import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({selector: '[kmReadonly]'})
export class ReadonlyDirective {
  constructor(private _el: ElementRef) {}

  @HostListener('input')
  onInput(): void {
    this._el.nativeElement.value = '';
  }
}
