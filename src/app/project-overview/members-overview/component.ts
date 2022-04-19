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

import {Component, Input} from '@angular/core';
import {Project} from '@shared/entity/project';
import {Member} from '@shared/entity/member';

@Component({
  selector: 'km-members-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class MembersOverviewComponent {
  @Input() project: Project;
  @Input() members: Member[] = [];

  get ownerNames(): string {
    return this.project?.owners.map(owner => owner.name).sort().join(', ');
  }

  get memberNames(): string {
    const members = this.members.filter(member => this.ownerNames.indexOf(member.name));
    return members.length ? members.map(member => member.name).sort().join(', ') : '-';
  }
}
