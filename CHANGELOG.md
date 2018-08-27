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
