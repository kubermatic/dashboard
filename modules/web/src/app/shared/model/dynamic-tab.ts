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

import {AfterViewInit, Directive, Output, ViewChild} from '@angular/core';
import {DynamicTabComponent} from '@shared/components/tab-card/dynamic-tab/component';
import {ReplaySubject} from 'rxjs';

@Directive()
export abstract class DynamicTab implements AfterViewInit {
  @ViewChild(DynamicTabComponent) tab: DynamicTabComponent;
  @Output('ontabready') onTabReady = new ReplaySubject<DynamicTabComponent>();

  ngAfterViewInit(): void {
    if (this.tab) {
      this.onTabReady.next(this.tab);
    }
  }
}
