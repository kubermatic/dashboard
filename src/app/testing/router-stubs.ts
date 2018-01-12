import { CommonModule } from '@angular/common';
export { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';

import { Component, Directive, Injectable, Input, HostListener } from '@angular/core';
import { NavigationExtras, convertToParamMap, ParamMap } from '@angular/router';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Directive({
    selector: '[routerLink]', // tslint:disable-line
})
export class RouterLinkStubDirective {
    @Input('routerLink') linkParams: any; // tslint:disable-line
    navigatedTo: any = null;

    @HostListener('click') onClick() {
        this.navigatedTo = this.linkParams;
    }
}

@Directive({
    selector: '[routerLinkActive]', // tslint:disable-line
})
export class RouterLinkActiveStubDirective {
    private classes: string[] = [];

    @Input()
    set routerLinkActive(data: string[]|string) {
        const classes = Array.isArray(data) ? data : data.split(' ');
        this.classes = classes.filter(c => !!c);
    }
}

@Component({
    selector: 'router-outlet', // tslint:disable-line
    template: ''
})
export class RouterOutletStubComponent { }

@Injectable()
export class RouterStub {
    navigate(commands: any[], extras?: NavigationExtras) { }
}

// Only implements params and part of snapshot.paramMap
@Injectable()
export class ActivatedRouteStub {

    // ActivatedRoute.paramMap is Observable
    private subject = new BehaviorSubject(convertToParamMap(this.testParamMap));
    paramMap = this.subject.asObservable();

    // Test parameters
    private _testParamMap: ParamMap;
    get testParamMap() { return this._testParamMap; }
    set testParamMap(params: {}) {
        this._testParamMap = convertToParamMap(params);
        this.subject.next(this._testParamMap);
    }

    // ActivatedRoute.snapshot.paramMap
    get snapshot() {
        return { paramMap: this.testParamMap };
    }
}

import { NgModule } from '@angular/core';

@NgModule({
  imports: [
      CommonModule
  ],
  declarations: [
    RouterOutletStubComponent,
    RouterLinkActiveStubDirective,
    RouterLinkStubDirective
  ],
exports: [
    RouterOutletStubComponent,
    RouterLinkActiveStubDirective,
    RouterLinkStubDirective
]
})
export class RouterTestingModule { }

