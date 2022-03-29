import {AfterViewInit, Directive, ElementRef} from '@angular/core';

@Directive({
  selector: '[kmAutofocusDialog]',
})
export class AutofocusDirectiveDialog implements AfterViewInit {
  constructor(private readonly _el: ElementRef) {}

  ngAfterViewInit(): void {
    this._el.nativeElement.focus();
  }
}
