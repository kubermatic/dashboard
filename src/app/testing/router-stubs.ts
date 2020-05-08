import {CommonModule} from '@angular/common';
import {
  Component,
  Directive,
  HostListener,
  Injectable,
  Input,
  NgModule,
} from '@angular/core';
import {convertToParamMap, NavigationExtras, ParamMap} from '@angular/router';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';

export {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';

@Directive({
  selector: '[routerLink]',
})
export class RouterLinkStubDirective {
  @Input('routerLink') linkParams: any;
  navigatedTo: any = null;

  @HostListener('click')
  onClick(): void {
    this.navigatedTo = this.linkParams;
  }
}

@Directive({
  selector: '[routerLinkActive]',
})
export class RouterLinkActiveStubDirective {
  @Input() set routerLinkActive(data: string[] | string) {}
}

@Component({
  selector: 'router-outlet',
  template: '',
})
export class RouterOutletStubComponent {}

@Injectable()
export class RouterStub {
  events = new Subject();

  navigate(commands: any[], extras?: NavigationExtras): void {}
}

@Injectable()
export class ActivatedRouteStub {
  private subject = new BehaviorSubject(convertToParamMap(this.testParamMap));
  paramMap = this.subject.asObservable();

  private _testParamMap: ParamMap;

  get testParamMap() {
    return this._testParamMap;
  }

  set testParamMap(params: {}) {
    this._testParamMap = convertToParamMap(params);
    this.subject.next(this._testParamMap);
  }

  get snapshot() {
    return {paramMap: this.testParamMap};
  }
}

@NgModule({
  imports: [CommonModule],
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
export class RouterTestingModule {}
