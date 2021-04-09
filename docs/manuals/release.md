## Pre-Release Procedure
List of steps to execute before proceeding with the [release procedure](#release-procedure). It mainly consists of
manual tests and visual checks of the Kubermatic Dashboard. 

Create a new issue based on the [pre-release issue template](). 

- Visual check of theme changes in the user settings (EE only)
- Items per page changes in the user settings
- Changes of the initial machine deployment replicas in the admin settings
- Changes of the user project limit in the admin settings  
- Changes of the resource quota in the admin settings
- Creation, update, check and deletion in the admin settings of the:
  - Dynamic datacenters
  - Administrators
  - Presets
  - Constraint templates
- API documentation
- Changelog
- AWS provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details 
  - Connection to Kubernetes Dashboard
- Azure provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details
- DigitalOcean provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details
- Hetzner provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details
- OpenStack provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details 
- Google Cloud provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details
- vSphere provider
  - Cluster creation with SSH key assigned
  - Cluster version upgrade
  - Initial machine deployment creation
  - Manual machine deployment creation
  - Machine deployment scaling
  - Machine deployment deletion
  - Addon creation & deletion
  - RBAC creation & deletion
  - SSH Key management from cluster details 
- External cluster connection

## Release Procedure
List of steps to follow after performing manual tests:

Create a new issue based on the [release issue template]().

- Version bump in the following files:
  - `package.json`
  - `package-lock.json`
  - `Makefile`
- Update changelog file (`src/assets/config/changelog.json`) with the latest release notes  



