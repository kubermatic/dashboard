// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {AfterContentInit, ChangeDetectionStrategy, Component, ContentChildren, QueryList} from '@angular/core';
import {TabComponent} from '@shared/components/tab-card/tab/component';

@Component({
  selector: 'km-tab-card',
  templateUrl: 'template.html',
  changeDetection: ChangeDetectionStrategy.OnPush, // TODO
})
export class TabCardComponent implements AfterContentInit {
  @ContentChildren(TabComponent) inputTabs: QueryList<TabComponent>;
  tabs: TabComponent[];

  public ngAfterContentInit(): void {
    this.tabs = this.inputTabs.toArray();
  }
}
