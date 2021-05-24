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

import {fakeMember} from '@app/testing/fake-data/member';
import {fakeProject} from '@app/testing/fake-data/project';
import {MemberUtils} from './member-utils';

describe('MemberUtils', () => {
  it('should get group in project', () => {
    expect(MemberUtils.getGroupInProject(fakeMember(), fakeProject().id)).toBe('owners');
  });

  it('should get group display name', () => {
    expect(MemberUtils.getGroupDisplayName('owners')).toBe('Owner');
    expect(MemberUtils.getGroupDisplayName('editors')).toBe('Editor');
    expect(MemberUtils.getGroupDisplayName('viewers')).toBe('Viewer');
    expect(MemberUtils.getGroupDisplayName('projectmanagers')).toBe('Project Manager');
  });
});
