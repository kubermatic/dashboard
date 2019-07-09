### [v1.3.0]()


- Service Accounts have been added to the UI [#1158](https://github.com/kubermatic/dashboard-v2/issues/1158) ([kgroschoff](https://github.com/kgroschoff))
- The project menu has been redesigned. [#1195](https://github.com/kubermatic/dashboard-v2/issues/1195) ([maciaszczykm](https://github.com/maciaszczykm))
- Fixed changing default OpenStack image on Operating System change [#1215](https://github.com/kubermatic/dashboard-v2/issues/1215) ([bashofmann](https://github.com/bashofmann))
- `containerRuntimeVersion` and `kernelVersion` are now displayed on NodeDeployment detail page [#1216](https://github.com/kubermatic/dashboard-v2/issues/1216) ([bashofmann](https://github.com/bashofmann))
- Custom links can now be added to the footer. [#1220](https://github.com/kubermatic/dashboard-v2/issues/1220) ([maciaszczykm](https://github.com/maciaszczykm))
- The OIDC provider URL is now configurable via &#34;oidc_provider_url&#34; variable. [#1222](https://github.com/kubermatic/dashboard-v2/issues/1222) ([maciaszczykm](https://github.com/maciaszczykm))
- The application logo has been changed. [#1232](https://github.com/kubermatic/dashboard-v2/issues/1232) ([maciaszczykm](https://github.com/maciaszczykm))
- The breadcrumbs component has been removed. The dialogs and buttons have been redesigned. [#1233](https://github.com/kubermatic/dashboard-v2/issues/1233) ([maciaszczykm](https://github.com/maciaszczykm))
- Serviceaccount tokens can now be downloaded. [#1234](https://github.com/kubermatic/dashboard-v2/issues/1234) ([kgroschoff](https://github.com/kgroschoff))
- Packet cloud provider is now supported. [#1238](https://github.com/kubermatic/dashboard-v2/issues/1238) ([maciaszczykm](https://github.com/maciaszczykm))
- Tables have been redesigned. [#1240](https://github.com/kubermatic/dashboard-v2/issues/1240) ([kgroschoff](https://github.com/kgroschoff))
- Added option to specify taints when creating/updating NodeDeployments [#1244](https://github.com/kubermatic/dashboard-v2/issues/1244) ([bashofmann](https://github.com/bashofmann))
- Styling of the cluster details view has been improved. [#1270](https://github.com/kubermatic/dashboard-v2/issues/1270) ([maciaszczykm](https://github.com/maciaszczykm))
- Missing parameters for OIDC providers have been added. [#1273](https://github.com/kubermatic/dashboard-v2/issues/1273) ([maciaszczykm](https://github.com/maciaszczykm))
- Add OpenShift support in UI [#1274](https://github.com/kubermatic/dashboard-v2/issues/1274) ([kgroschoff](https://github.com/kgroschoff))
- Dates are now displayed using relative format, i.e. 3 days ago. [#1303](https://github.com/kubermatic/dashboard-v2/issues/1303) ([maciaszczykm](https://github.com/maciaszczykm))
- Redesigned dialogs and cluster details page. [#1305](https://github.com/kubermatic/dashboard-v2/issues/1305) ([maciaszczykm](https://github.com/maciaszczykm))
- Add provider GCP to UI [#1307](https://github.com/kubermatic/dashboard-v2/issues/1307) ([kgroschoff](https://github.com/kgroschoff))
- Redesigned notifications. [#1315](https://github.com/kubermatic/dashboard-v2/issues/1315) ([maciaszczykm](https://github.com/maciaszczykm))
- The Instance Profile Name for AWS could be specified in UI. [#1317](https://github.com/kubermatic/dashboard-v2/issues/1317) ([kgroschoff](https://github.com/kgroschoff))
- Redesigned node deployment view. [#1320](https://github.com/kubermatic/dashboard-v2/issues/1320) ([maciaszczykm](https://github.com/maciaszczykm))
- Redesigned cluster details page. [#1345](https://github.com/kubermatic/dashboard-v2/issues/1345) ([kubermatic-bot](https://github.com/kubermatic-bot))




### [v1.2.2]()


**Misc:**

- Missing parameters for OIDC providers have been added. [#1273](https://github.com/kubermatic/dashboard-v2/issues/1273) ([maciaszczykm](https://github.com/maciaszczykm))




### [v1.2.1]()


**Misc:**

- `containerRuntimeVersion` and `kernelVersion` are now displayed on NodeDeployment detail page [#1217](https://github.com/kubermatic/dashboard-v2/issues/1217) ([kubermatic-bot](https://github.com/kubermatic-bot))
- Fixed changing default OpenStack image on Operating System change [#1218](https://github.com/kubermatic/dashboard-v2/issues/1218) ([kubermatic-bot](https://github.com/kubermatic-bot))
- The OIDC provider URL is now configurable via &#34;oidc_provider_url&#34; variable. [#1224](https://github.com/kubermatic/dashboard-v2/issues/1224) ([kubermatic-bot](https://github.com/kubermatic-bot))




### [v1.2.0]()


- Nodes and Node Deployments statuses are more accurate [#1016](https://github.com/kubermatic/dashboard-v2/issues/1016) ([maciaszczykm](https://github.com/maciaszczykm))
- DigitalOcean sizes and OpenStack flavors option pickers have been redesigned. [#1021](https://github.com/kubermatic/dashboard-v2/issues/1021) ([maciaszczykm](https://github.com/maciaszczykm))
- Smoother operation on bad network connection thanks to changes in asset caching. [#1030](https://github.com/kubermatic/dashboard-v2/issues/1030) ([kdomanski](https://github.com/kdomanski))
- Added a flag allowing to change the default number of nodes created with clusters. [#1032](https://github.com/kubermatic/dashboard-v2/issues/1032) ([maciaszczykm](https://github.com/maciaszczykm))
- Setting openstack tags for instances is possible via UI now. [#1038](https://github.com/kubermatic/dashboard-v2/issues/1038) ([kgroschoff](https://github.com/kgroschoff))
- Node Deployments can now be named. [#1039](https://github.com/kubermatic/dashboard-v2/issues/1039) ([maciaszczykm](https://github.com/maciaszczykm))
- Adding multiple owners to a project is possible via UI now. [#1042](https://github.com/kubermatic/dashboard-v2/issues/1042) ([kgroschoff](https://github.com/kgroschoff))
- kubelet version can now be specified for Node Deployments. [#1047](https://github.com/kubermatic/dashboard-v2/issues/1047) ([maciaszczykm](https://github.com/maciaszczykm))
- Events related to the Nodes are now displayed in the Node Deployment details view. [#1054](https://github.com/kubermatic/dashboard-v2/issues/1054) ([maciaszczykm](https://github.com/maciaszczykm))
- Fixed reload behaviour of openstack setting fields. [#1056](https://github.com/kubermatic/dashboard-v2/issues/1056) ([kgroschoff](https://github.com/kgroschoff))
- Fixed missing dashboard version info in the footer. [#1067](https://github.com/kubermatic/dashboard-v2/issues/1067) ([maciaszczykm](https://github.com/maciaszczykm))
- Project owners visible in project list view now. [#1082](https://github.com/kubermatic/dashboard-v2/issues/1082) ([kgroschoff](https://github.com/kgroschoff))
- Added possibility to assign labels to nodes. [#1101](https://github.com/kubermatic/dashboard-v2/issues/1101) ([maciaszczykm](https://github.com/maciaszczykm))
- User will be warned about cluster upgrades unavailable due to old nodes. [#1121](https://github.com/kubermatic/dashboard-v2/issues/1121) ([maciaszczykm](https://github.com/maciaszczykm))
- Updated list of AWS instance types to match latest available. [#1122](https://github.com/kubermatic/dashboard-v2/issues/1122) ([maciaszczykm](https://github.com/maciaszczykm))
- Fixed display number of replicas if the field is empty (0 replicas). [#1126](https://github.com/kubermatic/dashboard-v2/issues/1126) ([maciaszczykm](https://github.com/maciaszczykm))
- Added an option to include custom links into the application. [#1131](https://github.com/kubermatic/dashboard-v2/issues/1131) ([maciaszczykm](https://github.com/maciaszczykm))
- Minor layout issues with the cluster wizard have been fixed. [#1134](https://github.com/kubermatic/dashboard-v2/issues/1134) ([kgroschoff](https://github.com/kgroschoff))
- Removed AWS instance types t3.nano &amp; t3.micro as they are too small to schedule any workload on them [#1138](https://github.com/kubermatic/dashboard-v2/issues/1138) ([mrIncompetent](https://github.com/mrIncompetent))
- Application sidebar has been redesigned. [#1173](https://github.com/kubermatic/dashboard-v2/issues/1173) ([maciaszczykm](https://github.com/maciaszczykm))




### [v1.1.5]()


**Misc:**

- Removed AWS instance types t3.nano &amp; t3.micro as they are too small to schedule any workload on them [#1140](https://github.com/kubermatic/dashboard-v2/issues/1140) ([kubermatic-bot](https://github.com/kubermatic-bot))




### [v1.1.4]()


**Misc:**

- Minor layout issues with the cluster wizard have been fixed. [#1134](https://github.com/kubermatic/dashboard-v2/issues/1134) ([kgroschoff](https://github.com/kgroschoff))




### [v1.1.3]()


- Updated list of AWS instance types to match latest available. [#1127](https://github.com/kubermatic/dashboard-v2/issues/1127) ([kubermatic-bot](https://github.com/kubermatic-bot))




### [v1.1.2]()


- Fixed missing dashboard version info in the footer. [#1096](https://github.com/kubermatic/dashboard-v2/issues/1096) ([kubermatic-bot](https://github.com/kubermatic-bot))




### [v1.1.1]()

- Nodes and Node Deployments statuses are more accurate [#1016](https://github.com/kubermatic/dashboard-v2/issues/1016) ([maciaszczykm](https://github.com/maciaszczykm))
- DigitalOcean sizes and OpenStack flavors option pickers have been redesigned. [#1021](https://github.com/kubermatic/dashboard-v2/issues/1021) ([maciaszczykm](https://github.com/maciaszczykm))
- Smoother operation on bad network connection thanks to changes in asset caching. [#1030](https://github.com/kubermatic/dashboard-v2/issues/1030) ([kdomanski](https://github.com/kdomanski))
- Added a flag allowing to change the default number of nodes created with clusters. [#1032](https://github.com/kubermatic/dashboard-v2/issues/1032) ([maciaszczykm](https://github.com/maciaszczykm))
- Setting openstack tags for instances is possible via UI now. [#1038](https://github.com/kubermatic/dashboard-v2/issues/1038) ([kgroschoff](https://github.com/kgroschoff))
- Node Deployments can now be named. [#1039](https://github.com/kubermatic/dashboard-v2/issues/1039) ([maciaszczykm](https://github.com/maciaszczykm))
- kubelet version can now be specified for Node Deployments. [#1047](https://github.com/kubermatic/dashboard-v2/issues/1047) ([maciaszczykm](https://github.com/maciaszczykm))
- Events related to the Nodes are now displayed in the Node Deployment details view. [#1054](https://github.com/kubermatic/dashboard-v2/issues/1054) ([maciaszczykm](https://github.com/maciaszczykm))
- Fixed reload behaviour of openstack setting fields. [#1056](https://github.com/kubermatic/dashboard-v2/issues/1056) ([kgroschoff](https://github.com/kgroschoff))




### [v1.1.0]()


- It is now possible to edit the project name in UI. [#1003](https://github.com/kubermatic/dashboard-v2/issues/1003) ([kgroschoff](https://github.com/kgroschoff))
- Machine Networks for VSphere can now be set in the UI [#829](https://github.com/kubermatic/dashboard-v2/issues/829) ([kgroschoff](https://github.com/kgroschoff))
- VSphere: Setting a dedicated VSphere user for cloud provider functionalities is now possible. [#834](https://github.com/kubermatic/dashboard-v2/issues/834) ([kgroschoff](https://github.com/kgroschoff))
- Fixed that the cluster upgrade link did not appear directly when the details page is loaded [#836](https://github.com/kubermatic/dashboard-v2/issues/836) ([bashofmann](https://github.com/bashofmann))
- Kubeconfig can now be shared via a generated link from the UI [#857](https://github.com/kubermatic/dashboard-v2/issues/857) ([kgroschoff](https://github.com/kgroschoff))
- Fixed duplicated SSH keys in summary view during cluster creation. [#879](https://github.com/kubermatic/dashboard-v2/issues/879) ([kgroschoff](https://github.com/kgroschoff))
- On project change, the user will stay on the same page, if he has the corresponding rights. [#889](https://github.com/kubermatic/dashboard-v2/issues/889) ([kgroschoff](https://github.com/kgroschoff))
- Fixed issues with caching the main page. [#893](https://github.com/kubermatic/dashboard-v2/issues/893) ([maciaszczykm](https://github.com/maciaszczykm))
- Added support for creating, viewing, updating and deleting node deployments. [#949](https://github.com/kubermatic/dashboard-v2/issues/949) ([maciaszczykm](https://github.com/maciaszczykm))
- Added Node Deployment details view [#973](https://github.com/kubermatic/dashboard-v2/issues/973) ([maciaszczykm](https://github.com/maciaszczykm))




### [v1.0.2]()


- Removed Container Runtime selection, which is no longer supported. [#828](https://github.com/kubermatic/dashboard-v2/issues/828) ([bashofmann](https://github.com/bashofmann))
- Various minor visual improvements




### [v1.0.1]()


**Bugfix:**

- Menu entries will be disabled as long as selected project is not in active state.
- Selected project state icon was added in the project selector and in the list view.
- Input field inside add project dialog will be automatically focused after opening dialog.
- After adding new project user will be redirected to project list [#808](https://github.com/kubermatic/dashboard-v2/issues/808) ([maciaszczykm](https://github.com/maciaszczykm))


**Misc:**

- Notifications timeout is now 10s.
- Close and copy to clipboard actions are available on notifications. [#798](https://github.com/kubermatic/dashboard-v2/issues/798) ([maciaszczykm](https://github.com/maciaszczykm))
- Provider-specific data will now be fetched without re-sending credentials. [#814](https://github.com/kubermatic/dashboard-v2/issues/814) ([maciaszczykm](https://github.com/maciaszczykm))




### [v1.0.0]()


* The UI has been reworked for the new user/project management

**Bugfix:**

- &#34;Upgrade Cluster&#34; link is no longer available for clusters that have no updates available or are not ready [#750](https://github.com/kubermatic/dashboard-v2/issues/750) ([bashofmann](https://github.com/bashofmann))
- Fixed initial nodes data being lost when the browser tab was closed right after cluster creation [#796](https://github.com/kubermatic/dashboard-v2/issues/796) ([kgroschoff](https://github.com/kgroschoff))


**Misc:**

- Google Analytics code can now be optionally added by the administrator [#742](https://github.com/kubermatic/dashboard-v2/issues/742) ([bashofmann](https://github.com/bashofmann))
- OpenStack tenant can now be either chosen from dropdown or typed in by hand [#759](https://github.com/kubermatic/dashboard-v2/issues/759) ([kgroschoff](https://github.com/kgroschoff))
- vSphere: Network can now be selected from a list [#771](https://github.com/kubermatic/dashboard-v2/issues/771) ([kgroschoff](https://github.com/kgroschoff))
- Login token is now removed from URL for security reasons [#790](https://github.com/kubermatic/dashboard-v2/issues/790) ([bashofmann](https://github.com/bashofmann))
- `Admin` button has been removed from `Certificates and Keys` panel as it allowed to copy the admin token into the clipboard. Since this is a security concern we decided to remove this functionality. [#800](https://github.com/kubermatic/dashboard-v2/issues/800) ([p0lyn0mial](https://github.com/p0lyn0mial))


### [v0.38.0]()


- Provider-specific data will now be fetched without re-sending credentials. [#806](https://github.com/kubermatic/dashboard-v2/issues/806) ([maciaszczykm](https://github.com/maciaszczykm))




### [v0.37.1]()


- `Admin` button has been removed from `Certificates and Keys` panel as it allowed to copy the admin token into the clipboard. Since this is a security concern we decided to remove this functionality. [#800](https://github.com/kubermatic/dashboard-v2/issues/800) ([p0lyn0mial](https://github.com/p0lyn0mial))




### [v0.37]()


**Bugfix:**

- Fixed cluster settings view for Openstack [#746](https://github.com/kubermatic/dashboard-v2/issues/746) ([kgroschoff](https://github.com/kgroschoff))




### [v0.36]()


**Bugfix:**

- Fixed error appearing when trying to change selected OS [#699](https://github.com/kubermatic/dashboard-v2/issues/699) ([kgroschoff](https://github.com/kgroschoff))
- Openstack: fixed an issue, where list of tenants wouldn&#39;t get loaded when returning from summary page [#705](https://github.com/kubermatic/dashboard-v2/issues/705) ([kgroschoff](https://github.com/kgroschoff))
- Fixed confirmation of cluster deletion [#718](https://github.com/kubermatic/dashboard-v2/issues/718) ([kgroschoff](https://github.com/kgroschoff))
- Fixed the link to Kubernetes dashboard [#740](https://github.com/kubermatic/dashboard-v2/issues/740) ([guusvw](https://github.com/guusvw))


**Cloud Provider:**

- Openstack: show selected image in cluster creation summary [#698](https://github.com/kubermatic/dashboard-v2/issues/698) ([bashofmann](https://github.com/bashofmann))
- vSphere: custom cluster vnet can now be selected [#708](https://github.com/kubermatic/dashboard-v2/issues/708) ([kgroschoff](https://github.com/kgroschoff))
- Openstack: the list of available networks and floating IP pools will be loaded from the API [#737](https://github.com/kubermatic/dashboard-v2/issues/737) ([j3ank](https://github.com/j3ank))


**Misc:**

- Dashboard metrics can now be collected by Prometheus [#678](https://github.com/kubermatic/dashboard-v2/issues/678) ([pkavajin](https://github.com/pkavajin))
- Redesigned cluster creation summary page [#688](https://github.com/kubermatic/dashboard-v2/issues/688) ([kgroschoff](https://github.com/kgroschoff))
- Default template images for Openstack and vSphere are now taken from datacenter configuration [#689](https://github.com/kubermatic/dashboard-v2/issues/689) ([kgroschoff](https://github.com/kgroschoff))
- Various minor fixes and improvements




### [v0.35]()


**Misc:**

- Minor visual improvements [#684](https://github.com/kubermatic/dashboard-v2/issues/684) ([kgroschoff](https://github.com/kgroschoff))




### [v0.34]()


**Bugfix:**

- The node list will no longer be expanded when clicking on an IP [#676](https://github.com/kubermatic/dashboard-v2/issues/676) ([kgroschoff](https://github.com/kgroschoff))


**Cloud Provider:**

- Openstack: the tenant can now be picked from a list loaded from the API [#679](https://github.com/kubermatic/dashboard-v2/issues/679) ([kgroschoff](https://github.com/kgroschoff))


**Misc:**

- Added a button to easily duplicate an existing node [#675](https://github.com/kubermatic/dashboard-v2/issues/675) ([kgroschoff](https://github.com/kgroschoff))
- A note has been added to the footer identifying whether the dashboard is a part of a demo system [#682](https://github.com/kubermatic/dashboard-v2/issues/682) ([kgroschoff](https://github.com/kgroschoff))




### [v0.33]()


**Cloud Provider:**

- Enabled CoreOS on Openstack [#673](https://github.com/kubermatic/dashboard-v2/issues/673) ([kgroschoff](https://github.com/kgroschoff))


**Misc:**

- cri-o has been disabled [#670](https://github.com/kubermatic/dashboard-v2/issues/670) ([kgroschoff](https://github.com/kgroschoff))
- Node deletion can now be confirmed by pressing enter [#672](https://github.com/kubermatic/dashboard-v2/issues/672) ([kgroschoff](https://github.com/kgroschoff))




### [v0.32]()


**Bugfix:**

- Fixed a bug that caused the credentials to be tested against the API before the user is done typing them [#661](https://github.com/kubermatic/dashboard-v2/issues/661) ([kgroschoff](https://github.com/kgroschoff))


**Cloud Provider:**

- Added Azure support [#658](https://github.com/kubermatic/dashboard-v2/issues/658) ([kgroschoff](https://github.com/kgroschoff))


**Misc:**

- You can now choose a specific Kubernetes version for newly created clusters [#643](https://github.com/kubermatic/dashboard-v2/issues/643) ([kgroschoff](https://github.com/kgroschoff))
- Kubeconfig can now be downloaded even for paused clusters [#645](https://github.com/kubermatic/dashboard-v2/issues/645) ([kgroschoff](https://github.com/kgroschoff))
- Support button has been removed [#649](https://github.com/kubermatic/dashboard-v2/issues/649) ([kgroschoff](https://github.com/kgroschoff))
- Added CentOS support [#659](https://github.com/kubermatic/dashboard-v2/issues/659) ([kgroschoff](https://github.com/kgroschoff))
- Credentials fields are now password fields [#660](https://github.com/kubermatic/dashboard-v2/issues/660) ([kgroschoff](https://github.com/kgroschoff))
- Various minor fixes and improvements




### [v0.31]()


**Bugfix:**

- New Kubernetes versions will only be advertised for upgrade if they are a higher version [#639](https://github.com/kubermatic/dashboard-v2/issues/639) ([kgroschoff](https://github.com/kgroschoff))


**Cloud Provider:**

- Provider settings can now be edited in existing clusters [#638](https://github.com/kubermatic/dashboard-v2/issues/638) ([kgroschoff](https://github.com/kgroschoff))




### [v0.30]()


**Bugfix:**

- Fixed the display of very long cluster names [#592](https://github.com/kubermatic/dashboard-v2/issues/592) ([kgroschoff](https://github.com/kgroschoff))
- Removed duplicate info from AWS cluster creation summary [#593](https://github.com/kubermatic/dashboard-v2/issues/593) ([j3ank](https://github.com/j3ank))
- Fixed downloading kubeconfig in Firefox [#596](https://github.com/kubermatic/dashboard-v2/issues/596) ([kgroschoff](https://github.com/kgroschoff))
- Fixed node accordion opening up when deleting a node [#619](https://github.com/kubermatic/dashboard-v2/issues/619) ([kgroschoff](https://github.com/kgroschoff))


**Cloud Provider:**

- Disabled CoreOS on Openstack [#630](https://github.com/kubermatic/dashboard-v2/issues/630) ([kgroschoff](https://github.com/kgroschoff))


**Misc:**

- Node count will now default to 3 or 1 depending on whether the user is creating a new cluster or just adding nodes [#582](https://github.com/kubermatic/dashboard-v2/issues/582) ([kgroschoff](https://github.com/kgroschoff))
- Operating system logo will now be displayed on the node list [#586](https://github.com/kubermatic/dashboard-v2/issues/586) ([kgroschoff](https://github.com/kgroschoff))
  - Docker will be selected by default [#608](https://github.com/kubermatic/dashboard-v2/issues/608) ([kgroschoff](https://github.com/kgroschoff))
- Improved hint for SSH login name [#587](https://github.com/kubermatic/dashboard-v2/issues/587) ([kgroschoff](https://github.com/kgroschoff))
- Downloaded kubeconfig will now contain the cluster&#39;s ID in its file name [#600](https://github.com/kubermatic/dashboard-v2/issues/600) ([kgroschoff](https://github.com/kgroschoff))
- Paused clusters will now display the reason for pause [#602](https://github.com/kubermatic/dashboard-v2/issues/602) ([kgroschoff](https://github.com/kgroschoff))
- Optional fields of cluster configuration are now hidden in the simple view [#613](https://github.com/kubermatic/dashboard-v2/issues/613) ([kgroschoff](https://github.com/kgroschoff))
- Added a copy tooltip when hovering over an admin token [#629](https://github.com/kubermatic/dashboard-v2/issues/629) ([kgroschoff](https://github.com/kgroschoff))
- Node list has been redesigned [#633](https://github.com/kubermatic/dashboard-v2/issues/633) ([kgroschoff](https://github.com/kgroschoff))
  - Node list now shows nodes&#39; creation dates [#606](https://github.com/kubermatic/dashboard-v2/issues/606) ([kgroschoff](https://github.com/kgroschoff))
  - Node creation now allows to choose an OS and container runtime [#597](https://github.com/kubermatic/dashboard-v2/issues/597) ([kgroschoff](https://github.com/kgroschoff))
- Various minor fixes and improvements
