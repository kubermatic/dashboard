// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {CommonModule} from '@angular/common';
import {Component, Directive, HostListener, Injectable, Input, NgModule} from '@angular/core';
import {convertToParamMap, NavigationExtras, ParamMap} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {Subject} from 'rxjs';
import {RouterTestingModule as RouterMock} from '@angular/router/testing';

export {ActivatedRoute, Router, RouterLink, RouterOutlet} from '@angular/router';

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
  @Input() set routerLinkActive(_: string[] | string) {}
}

@Component({
  selector: 'router-outlet',
  template: '',
})
export class RouterOutletStubComponent {}

@Injectable()
export class RouterStub {
  events = new Subject<void>();

  navigate(_commands: any[], _extras?: NavigationExtras): void {}
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
  imports: [CommonModule, RouterMock],
  declarations: [RouterOutletStubComponent, RouterLinkActiveStubDirective, RouterLinkStubDirective],
  exports: [RouterOutletStubComponent, RouterLinkActiveStubDirective, RouterLinkStubDirective],
})
export class RouterTestingModule {}
