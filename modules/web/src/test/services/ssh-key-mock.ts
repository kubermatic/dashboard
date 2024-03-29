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

import {Injectable} from '@angular/core';
import {SSHKey} from '@shared/entity/ssh-key';
import {Observable, of} from 'rxjs';
import {fakeSSHKeys} from '../data/sshkey';

@Injectable()
export class SSHKeyMockService {
  add(_sshKey: SSHKey, _projectID: string): Observable<SSHKey> {
    return of(fakeSSHKeys()[0]);
  }

  list(_projectID: string): Observable<SSHKey[]> {
    return of(fakeSSHKeys());
  }

  delete(_sshkeyID: string, _projectID: string): Observable<any> {
    return of(null);
  }
}
