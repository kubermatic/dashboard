import {Endpoints} from '@ctypes/endpoints';
import {Fixtures} from '@ctypes/fixtures';
import {RequestType} from '@ctypes/http';
import {Intercept} from '@ctypes/intercept';
import {Provider} from '@ctypes/provider';

export class Clusters {
  private static _sshKeyListFixture = Fixtures.EmptyArray;
  private static _sshKeyFixture = Fixtures.EmptyObject;

  private readonly _provider: Intercept | undefined;

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
  static new(provider: Provider): Intercept {
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

abstract class ProviderBase implements Intercept {
  protected static _clusterListFixture: string = Fixtures.EmptyArray;
  protected static _clusterFixture: string = Fixtures.Provider.BringYourOwn.Cluster;

  protected constructor() {
    cy.intercept(RequestType.GET, Endpoints.Resource.Cluster.List, req =>
      req.reply({fixture: ProviderBase._clusterListFixture})
    );
    cy.intercept(RequestType.POST, Endpoints.Resource.Cluster.List, req =>
      req.reply({fixture: ProviderBase._clusterFixture})
    );
    cy.intercept(Endpoints.Resource.Cluster.Detail, req => req.reply({fixture: ProviderBase._clusterFixture}));
  }

  onDelete(): void {
    ProviderBase._clusterListFixture = Fixtures.EmptyArray;
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
    ProviderBase._clusterListFixture = Fixtures.Provider.Alibaba.ClusterList;
    ProviderBase._clusterFixture = Fixtures.Provider.Alibaba.Cluster;
  }
}

class BringYourOwn extends ProviderBase {
  constructor() {
    super();
  }

  onCreate(): void {
    ProviderBase._clusterListFixture = Fixtures.Provider.BringYourOwn.ClusterList;
    ProviderBase._clusterFixture = Fixtures.Provider.BringYourOwn.Cluster;
  }
}

class Digitalocean extends ProviderBase {
  constructor() {
    super();
  }

  onCreate(): void {
    ProviderBase._clusterListFixture = Fixtures.Provider.Digitalocean.ClusterList;
    ProviderBase._clusterFixture = Fixtures.Provider.Digitalocean.Cluster;
  }
}
