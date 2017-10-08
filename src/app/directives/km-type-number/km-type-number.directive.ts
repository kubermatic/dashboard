import { Directive, ElementRef, HostListener, EventEmitter, Output, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[kmTypeNumber]'
})
export class KmTypeNumberDirective {
  @Input() min: number;
  @Input() max: number;
  @Output() onInputChange = new EventEmitter();

  private regExp = /\d+/g;
  
  constructor(private el: ElementRef) {}

  @HostBinding('attr.min') get getMin() { return this.min; }
  @HostBinding('attr.max') get getMax() { return this.max; }

  @HostListener('input', ['$event']) onInput(event) {
    let max = this.el.nativeElement.max,
    min = this.el.nativeElement.min;

    if(!min || !max) throw new Error('Please, add min and max attribute to the element');

    let number = +event.target.value;
    let value;

    if(number) {
      value = number;
    }
    else {
      let result = event.target.value.match(this.regExp);
      value =  result ? result.join('') : '';
    }

    this.onInputChange.emit(value);
  }
}