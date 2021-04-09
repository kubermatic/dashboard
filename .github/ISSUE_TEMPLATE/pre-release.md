---
name: Pre-Release
title: [vX.XX] Pre-Release Procedure
assignees: @floreks @maciaszczykm @kgroschoff
about: The list of steps that should be executed prior to the release step list 
labels: sig/ui sig/release
---

## Pre-Release Procedure
List of steps to execute before proceeding with the [release procedure](docs/manuals/release.md#release-procedure). It mainly consists of
manual tests and visual checks of the Kubermatic Dashboard.

Every assignee should mark their name next to the checks they're willing to work on.

- [ ] Visual check of theme changes in the user settings (EE only)
- [ ] Items per page changes in the user settings
- [ ] Changes of the initial machine deployment replicas in the admin settings
- [ ] Changes of the user project limit in the admin settings
- [ ] Changes of the resource quota in the admin settings
- [ ] Creation, update, check and deletion in the admin settings of the:
  - [ ] Dynamic datacenters
  - [ ] Administrators
  - [ ] Presets
  - [ ] Constraint templates
- [ ] API documentation
- [ ] Changelog
- [ ] AWS provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
  - [ ] Connection to Kubernetes Dashboard
- [ ] Azure provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
- [ ] DigitalOcean provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
- [ ] Hetzner provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
- [ ] OpenStack provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
- [ ] Google Cloud provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
- [ ] vSphere provider
  - [ ] Cluster creation with SSH key assigned
  - [ ] Cluster version upgrade
  - [ ] Initial machine deployment creation
  - [ ] Manual machine deployment creation
  - [ ] Machine deployment scaling
  - [ ] Machine deployment deletion
  - [ ] Addon creation & deletion
  - [ ] RBAC creation & deletion
  - [ ] SSH Key management from cluster details
- [ ] External cluster connection
