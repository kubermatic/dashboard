enum Alibaba {
  ClusterList = 'alibaba/clusters.json',
  Cluster = 'alibaba/cluster.json',
  MachineDeploymentList = 'alibaba/machinedeployments.json',
  MachineDeployment = 'alibaba/machinedeployment.json',
  InstanceTypes = 'alibaba/instancetypes/json',
  VSwitches = 'alibaba/vswitches.json',
  Zones = 'alibaba/zones.json',
}

enum Anexia {
  ClusterList = 'anexia/clusters.json',
  Cluster = 'anexia/cluster.json',
  MachineDeploymentList = 'anexia/machinedeployments.json',
  MachineDeployment = 'anexia/machinedeployment.json',
}

enum AWS {
  ClusterList = 'aws/clusters.json',
  Cluster = 'aws/cluster.json',
  MachineDeploymentList = 'aws/machinedeployments.json',
  MachineDeployment = 'aws/machinedeployment.json',
}

enum Azure {
  ClusterList = 'azure/clusters.json',
  Cluster = 'azure/cluster.json',
  MachineDeploymentList = 'azure/machinedeployments.json',
  MachineDeployment = 'azure/machinedeployment.json',
}

enum BringYourOwn {
  ClusterList = 'bringyourown/clusters.json',
  Cluster = 'bringyourown/cluster.json',
  MachineDeploymentList = 'bringyourown/machinedeployments.json',
  MachineDeployment = 'bringyourown/machinedeployment.json',
}

enum Digitalocean {
  ClusterList = 'digitalocean/clusters.json',
  Cluster = 'digitalocean/cluster.json',
  MachineDeploymentList = 'digitalocean/machinedeployments.json',
  MachineDeployment = 'digitalocean/machinedeployment.json',
}

enum Equinix {
  ClusterList = 'equinix/clusters.json',
  Cluster = 'equinixcluster.json',
  MachineDeploymentList = 'equinix/machinedeployments.json',
  MachineDeployment = 'equinix/machinedeployment.json',
}

enum GCP {
  ClusterList = 'gcp/clusters.json',
  Cluster = 'gcp/cluster.json',
  MachineDeploymentList = 'gcp/machinedeployments.json',
  MachineDeployment = 'gcp/machinedeployment.json',
}

enum Hetzner {
  ClusterList = 'hetzner/clusters.json',
  Cluster = 'hetzner/cluster.json',
  MachineDeploymentList = 'hetzner/machinedeployments.json',
  MachineDeployment = 'hetzner/machinedeployment.json',
}

enum Nutanix {
  ClusterList = 'nutanix/clusters.json',
  Cluster = 'nutanix/cluster.json',
  MachineDeploymentList = 'nutanix/machinedeployments.json',
  MachineDeployment = 'nutanix/machinedeployment.json',
}

enum OpenStack {
  ClusterList = 'openstack/clusters.json',
  Cluster = 'openstack/cluster.json',
  MachineDeploymentList = 'openstack/machinedeployments.json',
  MachineDeployment = 'openstack/machinedeployment.json',
}

const Provider = {Alibaba, Anexia, AWS, Azure, BringYourOwn, Digitalocean, Equinix, GCP, Hetzner, Nutanix, OpenStack};
type Provider = typeof Provider;

enum SSHKey {
  List = 'ssh-keys.json',
  Detail = 'ssh-key.json',
}

const Resource = {SSHKey};

type Resource = typeof Resource;

const EmptyArray = 'empty-array.json';
const EmptyObject = 'empty-object.json';

export const Fixtures = {Provider, Resource, EmptyArray, EmptyObject};
export type Fixtures = typeof Fixtures;
