---
name: Pre-Release
title: "[vX.XX] Pre-Release Procedure"
assignees: floreks, maciaszczykm, kgroschoff
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
- [ ] Check using two browser windows if default and interface settings are successfully saved and loaded (as administrator)
- [ ] Check initial machine deployment replicas (as administrator)
- [ ] Check user project limit (as administrator)
- [ ] Check resource quota (as administrator)
- [ ] Check cleanup on cluster deletion (as administrator)
- [ ] Check operations like create, list, update and delete of dynamic datacenters (as administrator)
- [ ] Check operations like create, list, update and delete of presets (as administrator)
- [ ] Check operations like create, list, update and delete of constraint templates (as administrator)
- [ ] Check operations like create, list and delete of administrators (as administrator)

### Projects
- [ ] Check operations like create, list, update and delete
- [ ] Check pagination, filtering and sorting (in the list view)
- [ ] Check switch between list and cards view
- [ ] Check switch to show all project (as administrator)

### Clusters
- [ ] Check SSH key management from cluster details
- [ ] Check RBAC management from cluster details
- [ ] Check addon management from cluster details
- [ ] Check connection to Kubernetes Dashboard from cluster details
- [ ] Check external cluster connection, details and disconnection

### Cluster Templates
- [ ] Check creation of cluster templates with SSH key in the project scope and verify it was saved 
- [ ] Check creation of cluster templates in the user scope and verify it was saved
- [ ] Check creation of cluster templates in the global scope and verify it was saved (as administrator)
- [ ] Check cluster creation from the templates created before and verify if it is the same as expected
- [ ] Check cluster creation from the cluster template list and from the clusters list
- [ ] Check cluster template deletion
- [ ] Check cluster template management for at least 3 most common providers
- [ ] Check pagination, search and filtering

### Providers
- [ ] Alibaba
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] AWS
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] Azure
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] DigitalOcean
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] GCP
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] Hetzner
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] OpenStack
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] KubeVirt
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] Packet
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion
- [ ] vSphere
  - [ ] Check cluster creation with SSH key assigned
  - [ ] Check initial machine deployment creation
  - [ ] Check manual machine deployment creation with different operating systems
  - [ ] Check cluster version upgrades
  - [ ] Check machine deployment scaling
  - [ ] Check machine deployment deletion

### Other Features
- [ ] Check the changelog
- [ ] Check the API documentation
- [ ] Check the terms of service
