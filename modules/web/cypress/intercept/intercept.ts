// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Provider} from '@kmtypes';
import {Config} from '@utils/config';
import {Clusters} from './clusters';
import {Members} from './members';
import {Projects} from './projects';
import {Root} from './root';
import {ServiceAccounts} from './serviceaccounts';
import {AdminSettings} from './settings/admin';
import {SSHKeys} from './sshkeys';

export class Intercept {
  static init(provider?: Provider): void {
    if (Config.isAPIMocked()) {
      Intercept.Clusters(provider ? provider : Provider.kubeadm);
      Intercept.SSHKeys();
      Intercept.ServiceAccount();
      Intercept.Root();
      Intercept.Members();
      Intercept.Projects();
      Intercept.AdminSettings();
    }
  }

  static Clusters(provider: Provider): Clusters {
    return new Clusters(provider);
  }

  static SSHKeys(): SSHKeys {
    return new SSHKeys();
  }

  static ServiceAccount(): ServiceAccounts {
    return new ServiceAccounts();
  }

  static Root(): Root {
    return new Root();
  }

  static Members(): Members {
    return new Members();
  }

  static Projects(): Projects {
    return new Projects();
  }

  static AdminSettings(): AdminSettings {
    return new AdminSettings();
  }
}
