---
name: Pre-Release
title: "[vX.XX] Pre-Release Procedure"
about: The list of steps that should be executed prior to the release step list
labels: sig/ui, sig/release
---

## Pre-Release Procedure
List of steps to execute before proceeding with the release procedure. It mainly consists of
manual tests and visual checks of the Kubermatic Dashboard.

Every assignee should mark their name next to the checks or groups they're willing to work on.

### User Settings
- [ ] Check using two browser windows if settings are successfully saved and loaded
- [ ] Check all available themes (in enterprise edition)
- [ ] Check different items per page options across the application
- [ ] Check default project switch functionality

### Admin Settings
- [ ] Check if admin settings are available to administrators only
- [ ] Check using two browser windows if default and interface settings are successfully saved and loaded
- [ ] Check "Default and Limits" options
- [ ] Check "Interface" options
- [ ] Check "Accounts" list information
- [ ] Check "Backup destinations" configuration and usage
- [ ] Check operations like create, list, update and delete of dynamic datacenters
- [ ] Check operations like create, list, update and delete of provider presets
- [ ] Check operations like create, list and delete of administrators

### Metering
- [ ] Check metering configuration
- [ ] Check metering credentials configuration
- [ ] Check enabling and disabling metering
- [ ] Check listing reports
- [ ] Check downloading reports

### OPA
- [ ] Check if `Applies To` and `On/Off` columns are available only in enterprise edition in the default constraints list
- [ ] Check if allowed registries view is available only in enterprise edition
- [ ] Check options to enable and enforce OPA from the admin settings
- [ ] Check if `Constraints` and `Gatekeeper` tabs are visible in the cluster details if OPA was enabled
- [ ] Check operations like create, list, update and delete of constraints
- [ ] Check operations like create, list, update and delete of Gatekeeper config

### MLA
- [ ] Check options to enable and enforce MLA from the admin settings
- [ ] Check if `Monitoring, Logging & Alerting` tab is visible in the cluster details if MLA was enabled
- [ ] Check operations like create, list, update and delete of rule groups
- [ ] Check operations like update and reset of Alertmanager config

### Projects
- [ ] Check operations like create, list, update and delete
- [ ] Check pagination, filtering and sorting
- [ ] Check switch between list and cards view
- [ ] Check switch to show all project

### Clusters
- [ ] Check SSH key management from cluster details
- [ ] Check RBAC management from cluster details
- [ ] Check addon management from cluster details
<!-- Note: Kubernetes Dashboard is deprecated upstream; however, this feature remains supported and should be tested. -->
- [ ] Check connection to Kubernetes Dashboard from cluster details

### External Clusters
- [ ] Check external cluster Import/Connect functionality for all supported providers
- [ ] Check external cluster details and machine deployment details
- [ ] Check cluster version upgrades (for the supported providers)
- [ ] Check machine deployment scaling
- [ ] Check external cluster disconnect functionality

### Cluster Templates
- [ ] Check creation of cluster templates with SSH key in the project scope and verify it was saved
- [ ] Check creation of cluster templates in the user scope and verify it was saved
- [ ] Check creation of cluster templates in the global scope and verify it was saved
- [ ] Check cluster creation from the templates created before and verify if it is the same as expected
- [ ] Check cluster creation from the cluster template list and from the clusters list
- [ ] Check cluster template deletion
- [ ] Check cluster template management for at least 3 most common providers
- [ ] Check pagination, search and filtering

### Backups
- [ ] Check create and delete of automatic cluster backup/snapshot
- [ ] Check restore from snapshot
- [ ] Check if information about pending cluster restoration is available
- [ ] Check automated snapshot creation by automatic cluster backups

### Providers
- [ ] Alibaba
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] AWS
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] Azure
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] DigitalOcean
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] GCP
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] Hetzner
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] OpenStack
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] KubeVirt
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion
- [ ] vSphere
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
  - [ ] Check cluster deletion

### Other Features
- [ ] Check the changelog
- [ ] Check the API documentation
- [ ] Check the terms of service
- [ ] Check if all provider logos are up-to-date
- [ ] Visual checks of any UI related issues (padding, colors, overlapping elements, etc.)
