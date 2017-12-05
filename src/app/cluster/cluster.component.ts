import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, OnInit} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {ApiService} from "app/core/services/api/api.service";
import {environment} from "../../environments/environment";
import {Observable, Subscription} from "rxjs";
import {MdDialog} from '@angular/material';
import {ClusterDeleteConfirmationComponent} from "./cluster-delete-confirmation/cluster-delete-confirmation.component";
import {NodeEntity} from "../shared/entity/NodeEntity";
import {ClusterEntity} from "../shared/entity/ClusterEntity";
import {DataCenterEntity} from "../shared/entity/DatacenterEntity";
import {AWSAddNodeFormComponent} from "../forms/add-node/aws/aws-add-node.component";
import {DigitaloceanAddNodeComponent} from "../forms/add-node/digitalocean/digitalocean-add-node.component";
import {OpenstackAddNodeComponent} from "../forms/add-node/openstack/openstack-add-node.component";
import {NodeProvider} from "../shared/model/NodeProviderConstants";
import {AddNodeModalData} from "../forms/add-node/add-node-modal-data";
import {UpgradeClusterComponent} from './upgrade-cluster/upgrade-cluster.component';
import { CustomEventService, CreateNodesService, DatacenterService } from '../core/services';
import 'rxjs/add/operator/retry';

import {SSHKeyEntity} from "../shared/entity/SSHKeyEntity";
import {UpgradeClusterComponentData} from "../shared/model/UpgradeClusterDialogData";

@Component({
  selector: "kubermatic-cluster",
  templateUrl: "./cluster.component.html",
  styleUrls: ["./cluster.component.scss"],
  providers: [ApiService]
})
export class ClusterComponent implements OnInit {

  private restRoot: string = environment.restRoot;

  public nodes: any;
  //public nodes: NodeEntity[];
  public cluster: ClusterEntity;
  public seedDc: DataCenterEntity;
  public nodeDc: DataCenterEntity;
  public timer: any = Observable.timer(0,10000);
  public sub: Subscription;
  public dialogRef: any;
  public config: any = {};
  public clusterName: string;
  public loading: boolean = true;
  public sshKeys: SSHKeyEntity[] = [];
  private upgradesList: string[] = [];
  private gotUpgradesList: boolean;
  public groupedNodes: any;
  public stateOfTheAccordion: any;

  constructor(
    private customEventService: CustomEventService,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public dialog: MdDialog,
    private createNodesService: CreateNodesService,
    private dcService: DatacenterService
  ) {}

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.clusterName = params["clusterName"];
      this.sub = this.timer.subscribe(() => this.refreshData());
    });

    this.loadSshKeys();
    this.customEventService.subscribe('onNodeDelete', (nodeName: string) =>
      this.nodes = this.nodes.filter(node => node.metadata.name !== nodeName));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  loadUpgrades(): void {
    this.api.getClusterUpgrades(this.clusterName)
      .subscribe(upgrades => {
        this.upgradesList = upgrades;
        this.gotUpgradesList = true;
      });
  }

  loadDataCenter(dcName, dcObjectName):void {
    this.dcService.getDataCenter(dcName).subscribe(res =>
      this[dcObjectName] = new DataCenterEntity(res.metadata, res.spec, res.seed));
  }

  loadCluster(): Observable<ClusterEntity> {
    return this.api.getCluster(this.clusterName)
      .retry(3);
  }

  loadSshKeys(): void {
    this.api.getSSHKeys().subscribe(keys => {
      this.sshKeys = keys.filter(key => {
        if (key.spec.clusters == null) {
          return false;
        }
        return key.spec.clusters.indexOf(this.clusterName) > -1
      });
    });
  }

  loadNodes(): void {


    /*this.api.getClusterNodes(this.clusterName).subscribe(nodes => {
      this.nodes = nodes;
    });*/

    var groups = [];
    var nodesGrouped;

    this.nodes = [
      {
        "metadata": {
          "name": "kubermatic-m5w46txc6-9wlvm",
          "selfLink": "/api/v1/nodes/kubermatic-m5w46txc6-9wlvm",
          "uid": "dc0cdf8e-d369-11e7-8097-0a580a2c4f0e",
          "resourceVersion": "320615",
          "creationTimestamp": "2017-11-27T11:55:27Z",
          "labels": {
            "beta.kubernetes.io/arch": "amd64",
            "beta.kubernetes.io/os": "linux",
            "kubernetes.io/hostname": "kubermatic-m5w46txc6-9wlvm"
          },
          "annotations": {
            "alpha.kubernetes.io/provided-node-ip": "207.154.229.87",
            "flannel.alpha.coreos.com/backend-data": "{\"VtepMAC\":\"0a:f1:a2:a3:cc:c5\"}",
            "flannel.alpha.coreos.com/backend-type": "vxlan",
            "flannel.alpha.coreos.com/kube-subnet-manager": "true",
            "flannel.alpha.coreos.com/public-ip": "207.154.229.87",
            "node.alpha.kubernetes.io/ttl": "0",
            "node.k8s.io/driver-data": "{\"ConfigVersion\":3,\"Driver\":{\"IPAddress\":\"207.154.229.87\",\"MachineName\":\"kubermatic-m5w46txc6-9wlvm\",\"SSHUser\":\"core\",\"SSHPort\":22,\"SSHKeyPath\":\"machines/kubermatic-m5w46txc6-9wlvm/id_rsa\",\"StorePath\":\"\",\"SwarmMaster\":false,\"SwarmHost\":\"\",\"SwarmDiscovery\":\"\",\"AccessToken\":\"e18d6ce92c872cd97aaa9145ee440bade7308fb2dfba9289ac90bdb678b0ad96\",\"DropletID\":72666544,\"DropletName\":\"\",\"Image\":\"coreos-stable\",\"Region\":\"fra1\",\"SSHKeyID\":15828958,\"SSHKeyFingerprint\":\"\",\"SSHKey\":\"\",\"Size\":\"512mb\",\"IPv6\":false,\"Backups\":false,\"PrivateNetworking\":true,\"UserDataFile\":\"\",\"Tags\":\"kubermatic,kubermatic-cluster-m5w46txc6\"},\"DriverName\":\"digitalocean\",\"HostOptions\":{\"Driver\":\"\",\"Memory\":0,\"Disk\":0,\"EngineOptions\":{\"ArbitraryFlags\":null,\"Dns\":null,\"GraphDir\":\"\",\"Env\":null,\"Ipv6\":false,\"InsecureRegistry\":null,\"Labels\":null,\"LogLevel\":\"\",\"StorageDriver\":\"aufs\",\"SelinuxEnabled\":false,\"TlsVerify\":true,\"RegistryMirror\":null,\"InstallURL\":\"https://get.docker.com\"},\"SwarmOptions\":{\"IsSwarm\":false,\"Address\":\"\",\"Discovery\":\"\",\"Agent\":false,\"Master\":false,\"Host\":\"\",\"Image\":\"\",\"Strategy\":\"\",\"Heartbeat\":0,\"Overcommit\":0,\"ArbitraryFlags\":null,\"ArbitraryJoinFlags\":null,\"Env\":null,\"IsExperimental\":false},\"AuthOptions\":{\"Skip\":true,\"CertDir\":\"\",\"CaCertPath\":\"\",\"CaPrivateKeyPath\":\"\",\"CaCertRemotePath\":\"\",\"ServerCertPath\":\"\",\"ServerKeyPath\":\"\",\"ClientKeyPath\":\"\",\"ServerCertRemotePath\":\"\",\"ServerKeyRemotePath\":\"\",\"ClientCertPath\":\"\",\"ServerCertSANs\":null,\"StorePath\":\"\"}},\"Name\":\"kubermatic-m5w46txc6-9wlvm\"}",
            "node.k8s.io/hostname": "207.154.229.87",
            "node.k8s.io/public-ip": "207.154.229.87",
            "node.k8s.io/state": "running",
            "nodeset.k8s.io/node-class": "kubermatic-coreos-512mb-6cqcu",
            "volumes.kubernetes.io/controller-managed-attach-detach": "true"
          }, "finalizers": ["node.k8s.io/delete"]
        },
        "spec": {"podCIDR": "172.25.2.0/24", "externalID": "kubermatic-m5w46txc6-9wlvm"},
        "status": {
        "capacity": {"cpu": "1", "memory": "504268Ki", "pods": "110"},
        "allocatable": {"cpu": "950m", "memory": "299468Ki", "pods": "110"},
        "conditions": [
          {
            "type": "KernelDeadlock",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:44:50Z",
            "lastTransitionTime": "2017-11-27T11:58:21Z",
            "reason": "KernelHasNoDeadlock",
            "message": "kernel has no deadlock"
          }, {
            "type": "Ready",
            "status": "True",
            "lastHeartbeatTime": "2017-11-27T12:45:19Z",
            "lastTransitionTime": "2017-11-27T11:57:58Z",
            "reason": "KubeletReady",
            "message": "kubelet is posting ready status"
          }, {
            "type": "OutOfDisk",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:19Z",
            "lastTransitionTime": "2017-11-27T11:56:45Z",
            "reason": "KubeletHasSufficientDisk",
            "message": "kubelet has sufficient disk space available"
          }, {
            "type": "MemoryPressure",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:19Z",
            "lastTransitionTime": "2017-11-27T11:56:45Z",
            "reason": "KubeletHasSufficientMemory",
            "message": "kubelet has sufficient memory available"
          }, {
            "type": "DiskPressure",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:19Z",
            "lastTransitionTime": "2017-11-27T11:56:45Z",
            "reason": "KubeletHasNoDiskPressure",
            "message": "kubelet has no disk pressure"
          }],
        "addresses": [{"type": "InternalIP", "address": "207.154.229.87"}, {
          "type": "Hostname",
          "address": "kubermatic-m5w46txc6-9wlvm"
        }],
        "daemonEndpoints": {"kubeletEndpoint": {"Port": 10250}},
        "nodeInfo": {
          "machineID": "758427d3815f4a79be1e922aa075eb0e",
          "systemUUID": "758427D3-815F-4A79-BE1E-922AA075EB0E",
          "bootID": "57626218-e7f5-4d4b-af46-cf88adfa604c",
          "kernelVersion": "4.13.9-coreos",
          "osImage": "Container Linux by CoreOS 1520.8.0 (Ladybug)",
          "containerRuntimeVersion": "docker://1.12.6",
          "kubeletVersion": "v1.7.10",
          "kubeProxyVersion": "v1.7.10",
          "operatingSystem": "linux",
          "architecture": "amd64"
        },
        "images": [{
          "names": ["kubermatic/hyperkube-amd64@sha256:400b885ac32f4e26cbe4dbb7ed7244b2d6c5969299ba9db61ef1f2851bc07bbd", "kubermatic/hyperkube-amd64:v1.7.7"],
          "sizeBytes": 620194164
        }, {
          "names": ["gcr.io/google_containers/node-problem-detector@sha256:f95cab985c26b2f46e9bd43283e0bfa88860c14e0fb0649266babe8b65e9eb2b", "gcr.io/google_containers/node-problem-detector:v0.4.1"],
          "sizeBytes": 286561110
        }, {
          "names": ["quay.io/calico/node@sha256:c61f9e3ac4231291196e80f23a3dc43a82f37a7153aa03e3f0798577da4575dc", "quay.io/calico/node:v2.5.1"],
          "sizeBytes": 281544532
        }, {
          "names": ["gcr.io/google_containers/kubernetes-dashboard-amd64@sha256:327cfef378e88ffbc327f98dd24adacf6c9363c042db78e922d050f2bdcf6f78", "gcr.io/google_containers/kubernetes-dashboard-amd64:v1.7.1"],
          "sizeBytes": 128398274
        }, {
          "names": ["quay.io/calico/cni@sha256:df90cb1d18182fe41aef0eea293c0045473749e64b8dfd3e420db1a39e5edb39", "quay.io/calico/cni:v1.10.0"],
          "sizeBytes": 70252544
        }, {
          "names": ["quay.io/coreos/flannel@sha256:5fa9435c1e95be2ec4daa53a35c39d5e3cc99fce33ed4983f4bb707bc9fc175f", "quay.io/coreos/flannel:v0.8.0"],
          "sizeBytes": 50726799
        }, {
          "names": ["gcr.io/google_containers/cluster-proportional-autoscaler-amd64@sha256:003f98d9f411ddfa6ff6d539196355e03ddd69fa4ed38c7ffb8fec6f729afe2d", "gcr.io/google_containers/cluster-proportional-autoscaler-amd64:1.1.2-r2"],
          "sizeBytes": 49644153
        }, {
          "names": ["gcr.io/google_containers/k8s-dns-kube-dns-amd64@sha256:1a3fc069de481ae690188f6f1ba4664b5cc7760af37120f70c86505c79eea61d", "gcr.io/google_containers/k8s-dns-kube-dns-amd64:1.14.5"],
          "sizeBytes": 49383083
        }, {
          "names": ["gcr.io/google_containers/k8s-dns-sidecar-amd64@sha256:9aab42bf6a2a068b797fe7d91a5d8d915b10dbbc3d6f2b10492848debfba6044", "gcr.io/google_containers/k8s-dns-sidecar-amd64:1.14.5"],
          "sizeBytes": 41814849
        }, {
          "names": ["gcr.io/google_containers/k8s-dns-dnsmasq-nanny-amd64@sha256:46b933bb70270c8a02fa6b6f87d440f6f1fce1a5a2a719e164f83f7b109f7544", "gcr.io/google_containers/k8s-dns-dnsmasq-nanny-amd64:1.14.5"],
          "sizeBytes": 41419289
        }, {
          "names": ["gcr.io/google_containers/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516", "gcr.io/google_containers/pause-amd64:3.0"],
          "sizeBytes": 746888
        }]
      },
        "groupname": "test2"
      }, {
        "metadata": {
          "name": "kubermatic-m5w46txc6-b8lzw",
          "selfLink": "/api/v1/nodes/kubermatic-m5w46txc6-b8lzw",
          "uid": "dc0939bb-d369-11e7-8097-0a580a2c4f0e",
          "resourceVersion": "320610",
          "creationTimestamp": "2017-11-27T11:55:27Z",
          "labels": {
            "beta.kubernetes.io/arch": "amd64",
            "beta.kubernetes.io/os": "linux",
            "kubernetes.io/hostname": "kubermatic-m5w46txc6-b8lzw"
          },
          "annotations": {
            "alpha.kubernetes.io/provided-node-ip": "207.154.239.223",
            "flannel.alpha.coreos.com/backend-data": "{\"VtepMAC\":\"9e:a8:5c:c9:bb:e6\"}",
            "flannel.alpha.coreos.com/backend-type": "vxlan",
            "flannel.alpha.coreos.com/kube-subnet-manager": "true",
            "flannel.alpha.coreos.com/public-ip": "207.154.239.223",
            "node.alpha.kubernetes.io/ttl": "0",
            "node.k8s.io/driver-data": "{\"ConfigVersion\":3,\"Driver\":{\"IPAddress\":\"207.154.239.223\",\"MachineName\":\"kubermatic-m5w46txc6-b8lzw\",\"SSHUser\":\"core\",\"SSHPort\":22,\"SSHKeyPath\":\"machines/kubermatic-m5w46txc6-b8lzw/id_rsa\",\"StorePath\":\"\",\"SwarmMaster\":false,\"SwarmHost\":\"\",\"SwarmDiscovery\":\"\",\"AccessToken\":\"e18d6ce92c872cd97aaa9145ee440bade7308fb2dfba9289ac90bdb678b0ad96\",\"DropletID\":72666523,\"DropletName\":\"\",\"Image\":\"coreos-stable\",\"Region\":\"fra1\",\"SSHKeyID\":15828947,\"SSHKeyFingerprint\":\"\",\"SSHKey\":\"\",\"Size\":\"512mb\",\"IPv6\":false,\"Backups\":false,\"PrivateNetworking\":true,\"UserDataFile\":\"\",\"Tags\":\"kubermatic,kubermatic-cluster-m5w46txc6\"},\"DriverName\":\"digitalocean\",\"HostOptions\":{\"Driver\":\"\",\"Memory\":0,\"Disk\":0,\"EngineOptions\":{\"ArbitraryFlags\":null,\"Dns\":null,\"GraphDir\":\"\",\"Env\":null,\"Ipv6\":false,\"InsecureRegistry\":null,\"Labels\":null,\"LogLevel\":\"\",\"StorageDriver\":\"aufs\",\"SelinuxEnabled\":false,\"TlsVerify\":true,\"RegistryMirror\":null,\"InstallURL\":\"https://get.docker.com\"},\"SwarmOptions\":{\"IsSwarm\":false,\"Address\":\"\",\"Discovery\":\"\",\"Agent\":false,\"Master\":false,\"Host\":\"\",\"Image\":\"\",\"Strategy\":\"\",\"Heartbeat\":0,\"Overcommit\":0,\"ArbitraryFlags\":null,\"ArbitraryJoinFlags\":null,\"Env\":null,\"IsExperimental\":false},\"AuthOptions\":{\"Skip\":true,\"CertDir\":\"\",\"CaCertPath\":\"\",\"CaPrivateKeyPath\":\"\",\"CaCertRemotePath\":\"\",\"ServerCertPath\":\"\",\"ServerKeyPath\":\"\",\"ClientKeyPath\":\"\",\"ServerCertRemotePath\":\"\",\"ServerKeyRemotePath\":\"\",\"ClientCertPath\":\"\",\"ServerCertSANs\":null,\"StorePath\":\"\"}},\"Name\":\"kubermatic-m5w46txc6-b8lzw\"}",
            "node.k8s.io/hostname": "207.154.239.223",
            "node.k8s.io/public-ip": "207.154.239.223",
            "node.k8s.io/state": "running",
            "nodeset.k8s.io/node-class": "kubermatic-coreos-512mb-6cqcu",
            "volumes.kubernetes.io/controller-managed-attach-detach": "true"
          },
          "finalizers": ["node.k8s.io/delete"]
        },
        "spec": {"podCIDR": "172.25.0.0/24", "externalID": "kubermatic-m5w46txc6-b8lzw"},
        "status": {
          "capacity": {"cpu": "1", "memory": "504268Ki", "pods": "110"},
          "allocatable": {"cpu": "950m", "memory": "299468Ki", "pods": "110"},
          "conditions": [{
            "type": "KernelDeadlock",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:44:49Z",
            "lastTransitionTime": "2017-11-27T12:01:22Z",
            "reason": "KernelHasNoDeadlock",
            "message": "kernel has no deadlock"
          }, {
            "type": "Ready",
            "status": "True",
            "lastHeartbeatTime": "2017-11-27T12:45:16Z",
            "lastTransitionTime": "2017-11-27T12:00:04Z",
            "reason": "KubeletReady",
            "message": "kubelet is posting ready status"
          }, {
            "type": "OutOfDisk",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:16Z",
            "lastTransitionTime": "2017-11-27T11:57:02Z",
            "reason": "KubeletHasSufficientDisk",
            "message": "kubelet has sufficient disk space available"
          }, {
            "type": "MemoryPressure",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:16Z",
            "lastTransitionTime": "2017-11-27T11:57:02Z",
            "reason": "KubeletHasSufficientMemory",
            "message": "kubelet has sufficient memory available"
          }, {
            "type": "DiskPressure",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:16Z",
            "lastTransitionTime": "2017-11-27T11:57:02Z",
            "reason": "KubeletHasNoDiskPressure",
            "message": "kubelet has no disk pressure"
          }],
          "addresses": [{"type": "InternalIP", "address": "207.154.239.223"}, {
            "type": "Hostname",
            "address": "kubermatic-m5w46txc6-b8lzw"
          }],
          "daemonEndpoints": {"kubeletEndpoint": {"Port": 10250}},
          "nodeInfo": {
            "machineID": "cb093c3a3b1741fc885067cde05dbb73",
            "systemUUID": "CB093C3A-3B17-41FC-8850-67CDE05DBB73",
            "bootID": "cd64e1a6-9dc9-4d58-be80-cee867ea111c",
            "kernelVersion": "4.13.9-coreos",
            "osImage": "Container Linux by CoreOS 1520.8.0 (Ladybug)",
            "containerRuntimeVersion": "docker://1.12.6",
            "kubeletVersion": "v1.7.10",
            "kubeProxyVersion": "v1.7.10",
            "operatingSystem": "linux",
            "architecture": "amd64"
          },
          "images": [{
            "names": ["kubermatic/hyperkube-amd64@sha256:400b885ac32f4e26cbe4dbb7ed7244b2d6c5969299ba9db61ef1f2851bc07bbd", "kubermatic/hyperkube-amd64:v1.7.7"],
            "sizeBytes": 620194164
          }, {
            "names": ["gcr.io/google_containers/node-problem-detector@sha256:f95cab985c26b2f46e9bd43283e0bfa88860c14e0fb0649266babe8b65e9eb2b", "gcr.io/google_containers/node-problem-detector:v0.4.1"],
            "sizeBytes": 286561110
          }, {
            "names": ["quay.io/calico/node@sha256:c61f9e3ac4231291196e80f23a3dc43a82f37a7153aa03e3f0798577da4575dc", "quay.io/calico/node:v2.5.1"],
            "sizeBytes": 281544532
          }, {
            "names": ["quay.io/calico/cni@sha256:df90cb1d18182fe41aef0eea293c0045473749e64b8dfd3e420db1a39e5edb39", "quay.io/calico/cni:v1.10.0"],
            "sizeBytes": 70252544
          }, {
            "names": ["quay.io/coreos/flannel@sha256:5fa9435c1e95be2ec4daa53a35c39d5e3cc99fce33ed4983f4bb707bc9fc175f", "quay.io/coreos/flannel:v0.8.0"],
            "sizeBytes": 50726799
          }, {
            "names": ["gcr.io/google_containers/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516", "gcr.io/google_containers/pause-amd64:3.0"],
            "sizeBytes": 746888
          }]
        },
        "groupname" : "test"
      }, {
        "metadata": {
          "name": "kubermatic-m5w46txc6-vn6g7",
          "selfLink": "/api/v1/nodes/kubermatic-m5w46txc6-vn6g7",
          "uid": "dc0b1247-d369-11e7-8097-0a580a2c4f0e",
          "resourceVersion": "320609",
          "creationTimestamp": "2017-11-27T11:55:27Z",
          "labels": {
            "beta.kubernetes.io/arch": "amd64",
            "beta.kubernetes.io/os": "linux",
            "kubernetes.io/hostname": "kubermatic-m5w46txc6-vn6g7"
          },
          "annotations": {
            "alpha.kubernetes.io/provided-node-ip": "165.227.140.168",
            "flannel.alpha.coreos.com/backend-data": "{\"VtepMAC\":\"9a:c1:22:de:b4:33\"}",
            "flannel.alpha.coreos.com/backend-type": "vxlan",
            "flannel.alpha.coreos.com/kube-subnet-manager": "true",
            "flannel.alpha.coreos.com/public-ip": "165.227.140.168",
            "node.alpha.kubernetes.io/ttl": "0",
            "node.k8s.io/driver-data": "{\"ConfigVersion\":3,\"Driver\":{\"IPAddress\":\"165.227.140.168\",\"MachineName\":\"kubermatic-m5w46txc6-vn6g7\",\"SSHUser\":\"core\",\"SSHPort\":22,\"SSHKeyPath\":\"machines/kubermatic-m5w46txc6-vn6g7/id_rsa\",\"StorePath\":\"\",\"SwarmMaster\":false,\"SwarmHost\":\"\",\"SwarmDiscovery\":\"\",\"AccessToken\":\"e18d6ce92c872cd97aaa9145ee440bade7308fb2dfba9289ac90bdb678b0ad96\",\"DropletID\":72666562,\"DropletName\":\"\",\"Image\":\"coreos-stable\",\"Region\":\"fra1\",\"SSHKeyID\":15828967,\"SSHKeyFingerprint\":\"\",\"SSHKey\":\"\",\"Size\":\"512mb\",\"IPv6\":false,\"Backups\":false,\"PrivateNetworking\":true,\"UserDataFile\":\"\",\"Tags\":\"kubermatic,kubermatic-cluster-m5w46txc6\"},\"DriverName\":\"digitalocean\",\"HostOptions\":{\"Driver\":\"\",\"Memory\":0,\"Disk\":0,\"EngineOptions\":{\"ArbitraryFlags\":null,\"Dns\":null,\"GraphDir\":\"\",\"Env\":null,\"Ipv6\":false,\"InsecureRegistry\":null,\"Labels\":null,\"LogLevel\":\"\",\"StorageDriver\":\"aufs\",\"SelinuxEnabled\":false,\"TlsVerify\":true,\"RegistryMirror\":null,\"InstallURL\":\"https://get.docker.com\"},\"SwarmOptions\":{\"IsSwarm\":false,\"Address\":\"\",\"Discovery\":\"\",\"Agent\":false,\"Master\":false,\"Host\":\"\",\"Image\":\"\",\"Strategy\":\"\",\"Heartbeat\":0,\"Overcommit\":0,\"ArbitraryFlags\":null,\"ArbitraryJoinFlags\":null,\"Env\":null,\"IsExperimental\":false},\"AuthOptions\":{\"Skip\":true,\"CertDir\":\"\",\"CaCertPath\":\"\",\"CaPrivateKeyPath\":\"\",\"CaCertRemotePath\":\"\",\"ServerCertPath\":\"\",\"ServerKeyPath\":\"\",\"ClientKeyPath\":\"\",\"ServerCertRemotePath\":\"\",\"ServerKeyRemotePath\":\"\",\"ClientCertPath\":\"\",\"ServerCertSANs\":null,\"StorePath\":\"\"}},\"Name\":\"kubermatic-m5w46txc6-vn6g7\"}",
            "node.k8s.io/hostname": "165.227.140.168",
            "node.k8s.io/public-ip": "165.227.140.168",
            "node.k8s.io/state": "running",
            "nodeset.k8s.io/node-class": "kubermatic-coreos-512mb-6cqcu",
            "volumes.kubernetes.io/controller-managed-attach-detach": "true"
          },
          "finalizers": ["node.k8s.io/delete"]
        },
        "spec": {"podCIDR": "172.25.1.0/24", "externalID": "kubermatic-m5w46txc6-vn6g7"},
        "status": {
          "capacity": {"cpu": "1", "memory": "504268Ki", "pods": "110"},
          "allocatable": {"cpu": "950m", "memory": "299468Ki", "pods": "110"},
          "conditions": [{
            "type": "KernelDeadlock",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:10Z",
            "lastTransitionTime": "2017-11-27T11:58:43Z",
            "reason": "KernelHasNoDeadlock",
            "message": "kernel has no deadlock"
          }, {
            "type": "Ready",
            "status": "True",
            "lastHeartbeatTime": "2017-11-27T12:45:15Z",
            "lastTransitionTime": "2017-11-27T11:58:19Z",
            "reason": "KubeletReady",
            "message": "kubelet is posting ready status"
          }, {
            "type": "OutOfDisk",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:15Z",
            "lastTransitionTime": "2017-11-27T11:56:54Z",
            "reason": "KubeletHasSufficientDisk",
            "message": "kubelet has sufficient disk space available"
          }, {
            "type": "MemoryPressure",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:15Z",
            "lastTransitionTime": "2017-11-27T11:56:54Z",
            "reason": "KubeletHasSufficientMemory",
            "message": "kubelet has sufficient memory available"
          }, {
            "type": "DiskPressure",
            "status": "False",
            "lastHeartbeatTime": "2017-11-27T12:45:15Z",
            "lastTransitionTime": "2017-11-27T11:56:54Z",
            "reason": "KubeletHasNoDiskPressure",
            "message": "kubelet has no disk pressure"
          }],
          "addresses": [{"type": "InternalIP", "address": "165.227.140.168"}, {
            "type": "Hostname",
            "address": "kubermatic-m5w46txc6-vn6g7"
          }],
          "daemonEndpoints": {"kubeletEndpoint": {"Port": 10250}},
          "nodeInfo": {
            "machineID": "c4aa327a1d96474e8d42e0768045f2cb",
            "systemUUID": "C4AA327A-1D96-474E-8D42-E0768045F2CB",
            "bootID": "6e51f30d-72ec-4569-b53e-86f12550f6f0",
            "kernelVersion": "4.13.9-coreos",
            "osImage": "Container Linux by CoreOS 1520.8.0 (Ladybug)",
            "containerRuntimeVersion": "docker://1.12.6",
            "kubeletVersion": "v1.7.10",
            "kubeProxyVersion": "v1.7.10",
            "operatingSystem": "linux",
            "architecture": "amd64"
          },
          "images": [{
            "names": ["kubermatic/hyperkube-amd64@sha256:400b885ac32f4e26cbe4dbb7ed7244b2d6c5969299ba9db61ef1f2851bc07bbd", "kubermatic/hyperkube-amd64:v1.7.7"],
            "sizeBytes": 620194164
          }, {
            "names": ["gcr.io/google_containers/node-problem-detector@sha256:f95cab985c26b2f46e9bd43283e0bfa88860c14e0fb0649266babe8b65e9eb2b", "gcr.io/google_containers/node-problem-detector:v0.4.1"],
            "sizeBytes": 286561110
          }, {
            "names": ["quay.io/calico/node@sha256:c61f9e3ac4231291196e80f23a3dc43a82f37a7153aa03e3f0798577da4575dc", "quay.io/calico/node:v2.5.1"],
            "sizeBytes": 281544532
          }, {
            "names": ["quay.io/calico/cni@sha256:df90cb1d18182fe41aef0eea293c0045473749e64b8dfd3e420db1a39e5edb39", "quay.io/calico/cni:v1.10.0"],
            "sizeBytes": 70252544
          }, {
            "names": ["quay.io/coreos/flannel@sha256:5fa9435c1e95be2ec4daa53a35c39d5e3cc99fce33ed4983f4bb707bc9fc175f", "quay.io/coreos/flannel:v0.8.0"],
            "sizeBytes": 50726799
          }, {
            "names": ["gcr.io/google_containers/k8s-dns-kube-dns-amd64@sha256:1a3fc069de481ae690188f6f1ba4664b5cc7760af37120f70c86505c79eea61d", "gcr.io/google_containers/k8s-dns-kube-dns-amd64:1.14.5"],
            "sizeBytes": 49383083
          }, {
            "names": ["gcr.io/google_containers/k8s-dns-sidecar-amd64@sha256:9aab42bf6a2a068b797fe7d91a5d8d915b10dbbc3d6f2b10492848debfba6044", "gcr.io/google_containers/k8s-dns-sidecar-amd64:1.14.5"],
            "sizeBytes": 41814849
          }, {
            "names": ["gcr.io/google_containers/k8s-dns-dnsmasq-nanny-amd64@sha256:46b933bb70270c8a02fa6b6f87d440f6f1fce1a5a2a719e164f83f7b109f7544", "gcr.io/google_containers/k8s-dns-dnsmasq-nanny-amd64:1.14.5"],
            "sizeBytes": 41419289
          }, {
            "names": ["gcr.io/google_containers/pause-amd64@sha256:163ac025575b775d1c0f9bf0bdd0f086883171eb475b5068e7defa4ca9e76516", "gcr.io/google_containers/pause-amd64:3.0"],
            "sizeBytes": 746888
          }]
        },
        "groupname" : "test"
      }
  ];

    groups = this.nodes.reduce(function(obj,item){
      obj[item.groupname] = obj[item.groupname] || [];
      obj[item.groupname]['group'] = obj[item.groupname]['group'] || [];
      obj[item.groupname]['kubeletVersion'] = item.status.nodeInfo.kubeletVersion || "";
      obj[item.groupname]['allocatable'] = item.status.allocatable;
      obj[item.groupname]['group'].push(item);

      return obj;
    }, {});
    this.groupedNodes = Object.keys(groups).map(function(key){
      return {name: key,  nodes: groups[key]};
    });

    this.stateOfTheAccordion = Object.keys(groups).map(function (key) {
      return {name: key, state: false};

    })
  }

  refreshData(): void {
    this.loadCluster()
      .subscribe(
        res => {
          this.cluster = new ClusterEntity(
            res.metadata,
            res.spec,
            res.address,
            res.status,
          );

          if (!this.seedDc) {
            this.loadDataCenter(this.cluster.status.seed, 'seedDc');
          }

          if (!this.nodeDc) {
            this.loadDataCenter(this.cluster.spec.cloud.dc, 'nodeDc');
          }

          if (this.cluster.isFailed() && this.createNodesService.hasData) {
            this.createNodesService.preventCreatingInitialClusterNodes();
          }

          if (this.cluster.isRunning()) {
            this.loadNodes();

            if (this.gotUpgradesList) return;

            this.loadUpgrades();
          }
        },
        error => {
          if (error.status === 404) {
            this.router.navigate(['404']);
          }
        }
      );
  }

  public addNode(): void {
    let data = new AddNodeModalData(this.cluster, this.nodeDc);
    if (this.cluster.provider === NodeProvider.AWS) {
      this.dialogRef = this.dialog.open(AWSAddNodeFormComponent, {data: data});
    } else if (this.cluster.provider === NodeProvider.DIGITALOCEAN) {
      this.dialogRef = this.dialog.open(DigitaloceanAddNodeComponent, {data: data});
    } else if (this.cluster.provider === NodeProvider.OPENSTACK) {
      this.dialogRef = this.dialog.open(OpenstackAddNodeComponent, {data: data});
    } else {
      NotificationActions.error("Error", `Add node form is missing.`);
      return;
    }

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public deleteClusterDialog(): void {
    this.dialogRef = this.dialog.open(ClusterDeleteConfirmationComponent, this.config);

    this.dialogRef.componentInstance.humanReadableName = this.cluster.spec.humanReadableName;
    this.dialogRef.componentInstance.clusterName = this.clusterName;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  public upgradeClusterDialog(): void {
    let dialogWidth = '500px';

    this.dialogRef = this.dialog.open(UpgradeClusterComponent, {
      data: new UpgradeClusterComponentData(this.clusterName, this.upgradesList),
      width: dialogWidth
    });
  }

  public downloadKubeconfigUrl(): string {
    const authorization_token = localStorage.getItem("token");
    return `${this.restRoot}/cluster/${this.clusterName}/kubeconfig?token=${authorization_token}`;
  }

  public isLoaded() {
    return this.seedDc && this.nodeDc;
  }
}
