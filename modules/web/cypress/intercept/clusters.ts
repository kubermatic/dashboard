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

import {Endpoints, Fixtures, Interceptor, Provider, RequestType} from '@kmtypes';

export class Clusters {
  private static _sshKeyListFixture = Fixtures.EmptyArray;
  private static _sshKeyFixture = Fixtures.EmptyObject;

  private readonly _provider: Interceptor | undefined;

  constructor(provider: Provider) {
    this._provider = ProviderFactory.new(provider);

    cy.intercept(RequestType.GET, Endpoints.Resource.Cluster.SSHKeyList, req =>
      req.reply({fixture: Clusters._sshKeyListFixture})
    );
    cy.intercept(RequestType.POST, Endpoints.Resource.Cluster.SSHKey, req =>
      req.reply({fixture: Clusters._sshKeyListFixture})
    );
    cy.intercept(Endpoints.Resource.Cluster.SSHKey, req => req.reply({fixture: Clusters._sshKeyFixture}));
  }

  onCreate(): void {
    this._provider?.onCreate();
  }

  onDelete(): void {
    this._provider?.onDelete();
  }

  onSSHKeyCreate(): void {
    Clusters._sshKeyListFixture = Fixtures.Resource.SSHKey.List;
    Clusters._sshKeyFixture = Fixtures.Resource.SSHKey.Detail;
  }

  onSSHKeyDelete(): void {
    Clusters._sshKeyListFixture = Fixtures.EmptyArray;
    Clusters._sshKeyFixture = Fixtures.EmptyObject;
  }
}

class ProviderFactory {
  static new(provider: Provider): Interceptor {
    switch (provider) {
      case Provider.Alibaba:
        return new Alibaba();
      case Provider.kubeadm:
        return new BringYourOwn();
      case Provider.Digitalocean:
        return new Digitalocean();
    }

    throw new Error(`Provider ${provider} not supported.`);
  }
}

abstract class ProviderBase implements Interceptor {
  protected static _projectClusterListFixture: string = Fixtures.EmptyProjectClusterList;
  protected static _clusterFixture: string = Fixtures.Provider.BringYourOwn.Cluster;
  protected static _machineDeploymentListFixture: string;
  protected static _machineDeploymentFixture: string;

  protected constructor() {
    cy.intercept(RequestType.GET, Endpoints.Resource.Cluster.List, req =>
      req.reply({fixture: ProviderBase._projectClusterListFixture})
    );
    cy.intercept(RequestType.POST, Endpoints.Resource.Cluster.Create, req =>
      req.reply({fixture: ProviderBase._clusterFixture})
    );
    cy.intercept(Endpoints.Resource.Cluster.Detail, req => req.reply({fixture: ProviderBase._clusterFixture}));
  }

  onDelete(): void {
    ProviderBase._projectClusterListFixture = Fixtures.EmptyProjectClusterList;
    ProviderBase._clusterFixture = Fixtures.EmptyObject;
  }

  abstract onCreate(): void;
}

class Alibaba extends ProviderBase {
  private static _zonesFixture = Fixtures.Provider.Alibaba.Zones;

  constructor() {
    super();

    cy.intercept(Endpoints.Provider.Alibaba.Zones, req => req.reply({fixture: Alibaba._zonesFixture}));
  }

  onCreate(): void {
    ProviderBase._projectClusterListFixture = Fixtures.Provider.Alibaba.ClusterList;
    ProviderBase._clusterFixture = Fixtures.Provider.Alibaba.Cluster;
  }
}

class BringYourOwn extends ProviderBase {
  constructor() {
    super();
  }

  onCreate(): void {
    ProviderBase._projectClusterListFixture = Fixtures.Provider.BringYourOwn.ClusterList;
    ProviderBase._clusterFixture = Fixtures.Provider.BringYourOwn.Cluster;
  }
}

class Digitalocean extends ProviderBase {
  private static _sizesFixture = Fixtures.Provider.Digitalocean.Sizes;

  constructor() {
    super();

    cy.intercept(Endpoints.Provider.Digitalocean.Sizes, req => req.reply({fixture: Digitalocean._sizesFixture}));
    cy.intercept(Endpoints.Resource.MachineDeployment.List, req =>
      req.reply({fixture: Digitalocean._machineDeploymentListFixture})
    );
    cy.intercept(Endpoints.Resource.MachineDeployment.Detail, req =>
      req.reply({fixture: Digitalocean._machineDeploymentFixture})
    );
  }

  onCreate(): void {
    ProviderBase._projectClusterListFixture = Fixtures.Provider.Digitalocean.ClusterList;
    ProviderBase._clusterFixture = Fixtures.Provider.Digitalocean.Cluster;
    ProviderBase._machineDeploymentListFixture = Fixtures.Provider.Digitalocean.MachineDeploymentList;
    ProviderBase._machineDeploymentFixture = Fixtures.Provider.Digitalocean.MachineDeployment;
  }
}
