import { CommonModule } from '@angular/common';
import { Component, Directive, HostListener, Injectable, Input, NgModule } from '@angular/core';
import { convertToParamMap, NavigationExtras, ParamMap } from '@angular/router';
export { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

@Directive({
  selector: '[routerLink]', // tslint:disable-line
})
export class RouterLinkStubDirective {
  @Input('routerLink') linkParams: any; // tslint:disable-line
  navigatedTo: any = null;

  @HostListener('click') onClick(): void {
    this.navigatedTo = this.linkParams;
  }
}

@Directive({
  selector: '[routerLinkActive]', // tslint:disable-line
})
export class RouterLinkActiveStubDirective {
  // @ts-ignore
  private classes: string[] = [];

  @Input()
  set routerLinkActive(data: string[] | string) { // tslint:disable-line
    const classes = Array.isArray(data) ? data : data.split(' ');
    this.classes = classes.filter((c) => !!c);
  }
}

@Component({
  selector: 'router-outlet', // tslint:disable-line
  template: '',
})
export class RouterOutletStubComponent {
}

@Injectable()
export class RouterStub {
  public events = new Subject();

  navigate(commands: any[], extras?: NavigationExtras): void { }
}

@Injectable()
export class ActivatedRouteStub {

  private subject = new BehaviorSubject(convertToParamMap(this.testParamMap));
  paramMap = this.subject.asObservable();

  private _testParamMap: ParamMap;

  get testParamMap() { return this._testParamMap; } // tslint:disable-line

  set testParamMap(params: {}) { // tslint:disable-line
    this._testParamMap = convertToParamMap(params);
    this.subject.next(this._testParamMap);
  }

  get snapshot() { // tslint:disable-line
    return { paramMap: this.testParamMap };
  }
}

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    RouterOutletStubComponent,
    RouterLinkActiveStubDirective,
    RouterLinkStubDirective,
  ],
  exports: [
    RouterOutletStubComponent,
    RouterLinkActiveStubDirective,
    RouterLinkStubDirective,
  ],
})
export class RouterTestingModule {
}
