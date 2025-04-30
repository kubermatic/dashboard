/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package machine

import (
	"fmt"
	"strconv"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	nutanixprovider "k8c.io/dashboard/v2/pkg/provider/cloud/nutanix"
	clusterv1alpha1 "k8c.io/machine-controller/sdk/apis/cluster/v1alpha1"
	alibaba "k8c.io/machine-controller/sdk/cloudprovider/alibaba"
	anexia "k8c.io/machine-controller/sdk/cloudprovider/anexia"
	aws "k8c.io/machine-controller/sdk/cloudprovider/aws"
	azure "k8c.io/machine-controller/sdk/cloudprovider/azure"
	baremetal "k8c.io/machine-controller/sdk/cloudprovider/baremetal"
	plugins "k8c.io/machine-controller/sdk/cloudprovider/baremetal/plugins"
	digitalocean "k8c.io/machine-controller/sdk/cloudprovider/digitalocean"
	equinixmetal "k8c.io/machine-controller/sdk/cloudprovider/equinixmetal"
	gce "k8c.io/machine-controller/sdk/cloudprovider/gce"
	hetzner "k8c.io/machine-controller/sdk/cloudprovider/hetzner"
	kubevirt "k8c.io/machine-controller/sdk/cloudprovider/kubevirt"
	nutanix "k8c.io/machine-controller/sdk/cloudprovider/nutanix"
	opennebula "k8c.io/machine-controller/sdk/cloudprovider/opennebula"
	openstack "k8c.io/machine-controller/sdk/cloudprovider/openstack"
	vcd "k8c.io/machine-controller/sdk/cloudprovider/vmwareclouddirector"
	vsphere "k8c.io/machine-controller/sdk/cloudprovider/vsphere"
	"k8c.io/machine-controller/sdk/providerconfig"
	"k8c.io/machine-controller/sdk/userdata/amzn2"
	"k8c.io/machine-controller/sdk/userdata/flatcar"
	"k8c.io/machine-controller/sdk/userdata/rhel"
	"k8c.io/machine-controller/sdk/userdata/rockylinux"
	"k8c.io/machine-controller/sdk/userdata/ubuntu"

	"k8s.io/apimachinery/pkg/util/json"
	"k8s.io/utils/ptr"
)

// GetAPIV1OperatingSystemSpec returns the api compatible OperatingSystemSpec for the given machine.
func GetAPIV1OperatingSystemSpec(machineSpec clusterv1alpha1.MachineSpec) (*apiv1.OperatingSystemSpec, error) {
	decodedProviderSpec, err := providerconfig.GetConfig(machineSpec.ProviderSpec)
	if err != nil {
		return nil, fmt.Errorf("failed to get machine providerConfig: %w", err)
	}

	operatingSystemSpec := &apiv1.OperatingSystemSpec{}

	switch decodedProviderSpec.OperatingSystem {
	case providerconfig.OperatingSystemFlatcar:
		config := &flatcar.Config{}
		if err := json.Unmarshal(decodedProviderSpec.OperatingSystemSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse flatcar config: %w", err)
		}

		operatingSystemSpec.Flatcar = &apiv1.FlatcarSpec{
			DisableAutoUpdate: config.DisableAutoUpdate,
		}
		if config.ProvisioningUtility == flatcar.CloudInit {
			operatingSystemSpec.Flatcar.ProvisioningUtility = flatcar.CloudInit
		}

	case providerconfig.OperatingSystemUbuntu:
		config := &ubuntu.Config{}
		if err := json.Unmarshal(decodedProviderSpec.OperatingSystemSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse ubuntu config: %w", err)
		}
		operatingSystemSpec.Ubuntu = &apiv1.UbuntuSpec{
			DistUpgradeOnBoot: config.DistUpgradeOnBoot,
		}

	case providerconfig.OperatingSystemRHEL:
		config := &rhel.Config{}
		if err := json.Unmarshal(decodedProviderSpec.OperatingSystemSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse rhel config: %w", err)
		}
		operatingSystemSpec.RHEL = &apiv1.RHELSpec{
			DistUpgradeOnBoot:               config.DistUpgradeOnBoot,
			RHELSubscriptionManagerUser:     config.RHELSubscriptionManagerUser,
			RHELSubscriptionManagerPassword: config.RHELSubscriptionManagerPassword,
			RHSMOfflineToken:                config.RHSMOfflineToken,
		}

	case providerconfig.OperatingSystemRockyLinux:
		config := &rockylinux.Config{}
		if err := json.Unmarshal(decodedProviderSpec.OperatingSystemSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse rockylinux config: %w", err)
		}
		operatingSystemSpec.RockyLinux = &apiv1.RockyLinuxSpec{
			DistUpgradeOnBoot: config.DistUpgradeOnBoot,
		}

	case providerconfig.OperatingSystemAmazonLinux2:
		config := &amzn2.Config{}
		if err := json.Unmarshal(decodedProviderSpec.OperatingSystemSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse amzn2 config: %w", err)
		}
		operatingSystemSpec.AmazonLinux = &apiv1.AmazonLinuxSpec{
			DistUpgradeOnBoot: config.DistUpgradeOnBoot,
		}
	}

	return operatingSystemSpec, nil
}

func GetAPIV2NodeNetworkSpec(machineSpec clusterv1alpha1.MachineSpec) (*apiv1.NetworkSpec, error) {
	decodedProviderSpec, err := providerconfig.GetConfig(machineSpec.ProviderSpec)
	if err != nil {
		return nil, fmt.Errorf("failed to get machine providerConfig: %w", err)
	}

	if decodedProviderSpec.Network != nil {
		return &apiv1.NetworkSpec{
			CIDR:     decodedProviderSpec.Network.CIDR,
			Gateway:  decodedProviderSpec.Network.Gateway,
			DNS:      decodedProviderSpec.Network.DNS,
			IPFamily: string(decodedProviderSpec.Network.IPFamily),
		}, nil
	}
	return nil, nil
}

// GetAPIV2NodeCloudSpec returns the api compatible NodeCloudSpec for the given machine.
func GetAPIV2NodeCloudSpec(machineSpec clusterv1alpha1.MachineSpec) (*apiv1.NodeCloudSpec, error) {
	decodedProviderSpec, err := providerconfig.GetConfig(machineSpec.ProviderSpec)
	if err != nil {
		return nil, fmt.Errorf("failed to get machine providerConfig: %w", err)
	}

	cloudSpec := &apiv1.NodeCloudSpec{}

	switch decodedProviderSpec.CloudProvider {
	case providerconfig.CloudProviderAWS:
		config := &aws.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse aws config: %w", err)
		}

		spotInstanceMaxPrice, spotInstanceInterruptionBehavior, spotInstancePersistentRequest := extractSpotInstanceConfigs(config)

		cloudSpec.AWS = &apiv1.AWSNodeSpec{
			Tags:                             config.Tags,
			VolumeSize:                       config.DiskSize,
			VolumeType:                       config.DiskType.Value,
			InstanceType:                     config.InstanceType.Value,
			AMI:                              config.AMI.Value,
			AvailabilityZone:                 config.AvailabilityZone.Value,
			SubnetID:                         config.SubnetID.Value,
			AssignPublicIP:                   config.AssignPublicIP,
			IsSpotInstance:                   config.IsSpotInstance,
			SpotInstanceMaxPrice:             spotInstanceMaxPrice,
			SpotInstancePersistentRequest:    spotInstancePersistentRequest,
			SpotInstanceInterruptionBehavior: spotInstanceInterruptionBehavior,
			AssumeRoleARN:                    config.AssumeRoleARN.Value,
			AssumeRoleExternalID:             config.AssumeRoleExternalID.Value,
			EBSVolumeEncrypted:               config.EBSVolumeEncrypted.Value,
		}
	case providerconfig.CloudProviderAzure:
		config := &azure.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse Azure config: %w", err)
		}
		cloudSpec.Azure = &apiv1.AzureNodeSpec{
			Size:                        config.VMSize.Value,
			AssignPublicIP:              config.AssignPublicIP.Value != nil && *config.AssignPublicIP.Value,
			Tags:                        config.Tags,
			ImageID:                     config.ImageID.Value,
			Zones:                       config.Zones,
			DataDiskSize:                config.DataDiskSize,
			OSDiskSize:                  config.OSDiskSize,
			EnableAcceleratedNetworking: config.EnableAcceleratedNetworking,
		}
	case providerconfig.CloudProviderDigitalocean:
		config := &digitalocean.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse digitalocean config: %w", err)
		}
		cloudSpec.Digitalocean = &apiv1.DigitaloceanNodeSpec{
			IPv6:       config.IPv6.Value != nil && *config.IPv6.Value,
			Size:       config.Size.Value,
			Backups:    config.Backups.Value != nil && *config.Backups.Value,
			Monitoring: config.Monitoring.Value != nil && *config.Backups.Value,
		}
		for _, v := range config.Tags {
			cloudSpec.Digitalocean.Tags = append(cloudSpec.Digitalocean.Tags, v.Value)
		}
	case providerconfig.CloudProviderOpenstack:
		config := &openstack.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse openstack config: %w", err)
		}
		cloudSpec.Openstack = &apiv1.OpenstackNodeSpec{
			Flavor:                    config.Flavor.Value,
			Image:                     config.Image.Value,
			Tags:                      config.Tags,
			AvailabilityZone:          config.AvailabilityZone.Value,
			ServerGroup:               config.ServerGroup.Value,
			InstanceReadyCheckPeriod:  config.InstanceReadyCheckPeriod.Value,
			InstanceReadyCheckTimeout: config.InstanceReadyCheckTimeout.Value,
		}
		cloudSpec.Openstack.UseFloatingIP = config.FloatingIPPool.Value != ""
		if config.RootDiskSizeGB != nil && *config.RootDiskSizeGB > 0 {
			cloudSpec.Openstack.RootDiskSizeGB = config.RootDiskSizeGB
		}
		if cd := config.ConfigDrive.Value; cd != nil {
			cloudSpec.Openstack.ConfigDrive = *cd
		}
	case providerconfig.CloudProviderHetzner:
		config := &hetzner.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse hetzner config: %w", err)
		}
		cloudSpec.Hetzner = &apiv1.HetznerNodeSpec{
			Type: config.ServerType.Value,
		}
		// MachineDeployments created by KKP will only ever have a single network
		// set, but users might have created ones with many; we have to make a choice
		// here as to what to display in KKP.
		if len(config.Networks) > 0 {
			cloudSpec.Hetzner.Network = config.Networks[0].Value
		}
	case providerconfig.CloudProviderVsphere:
		config := &vsphere.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse vsphere config: %w", err)
		}
		cloudSpec.VSphere = &apiv1.VSphereNodeSpec{
			CPUs:           int(config.CPUs),
			Memory:         int(config.MemoryMB),
			DiskSizeGB:     config.DiskSizeGB,
			Template:       config.TemplateVMName.Value,
			VMAntiAffinity: config.VMAntiAffinity.Value,
			VMGroup:        config.VMGroup.Value,
		}
		for _, v := range config.Tags {
			cloudSpec.VSphere.Tags = append(cloudSpec.VSphere.Tags, apiv1.VSphereTag{
				Name:        v.Name,
				Description: v.Description,
				CategoryID:  v.CategoryID,
				ID:          v.ID,
			})
		}
	case providerconfig.CloudProviderVMwareCloudDirector:
		config := &vcd.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse VMWare Cloud Director config: %w", err)
		}
		cloudSpec.VMwareCloudDirector = &apiv1.VMwareCloudDirectorNodeSpec{
			CPUs:             int(config.CPUs),
			CPUCores:         int(config.CPUCores),
			MemoryMB:         int(config.MemoryMB),
			DiskSizeGB:       config.DiskSizeGB,
			Template:         config.Template.Value,
			Catalog:          config.Catalog.Value,
			DiskIOPS:         config.DiskIOPS,
			VApp:             config.VApp.Value,
			Network:          config.Network.Value,
			IPAllocationMode: config.IPAllocationMode,
		}

		if config.StorageProfile != nil {
			cloudSpec.VMwareCloudDirector.StorageProfile = *config.StorageProfile
		}

		if config.Metadata != nil {
			cloudSpec.VMwareCloudDirector.Metadata = *config.Metadata
		}

		if config.SizingPolicy != nil {
			cloudSpec.VMwareCloudDirector.SizingPolicy = config.SizingPolicy
		}

		if config.PlacementPolicy != nil {
			cloudSpec.VMwareCloudDirector.PlacementPolicy = config.PlacementPolicy
		}

	case providerconfig.CloudProviderEquinixMetal, providerconfig.CloudProviderPacket:
		config := &equinixmetal.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse equinixmetal config: %w", err)
		}
		cloudSpec.Packet = &apiv1.PacketNodeSpec{
			InstanceType: config.InstanceType.Value,
		}
		for _, v := range config.Tags {
			cloudSpec.Packet.Tags = append(cloudSpec.Packet.Tags, v.Value)
		}
	case providerconfig.CloudProviderEdge:
		cloudSpec.Edge = &apiv1.EdgeNodeSpec{}
	case providerconfig.CloudProviderExternal:
		// do nothing here as the external cloud provider doesn't have any specific cloud spec.
	case providerconfig.CloudProviderGoogle:
		config := &gce.CloudProviderSpec{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse gcp config: %w", err)
		}
		cloudSpec.GCP = &apiv1.GCPNodeSpec{
			Zone:        config.Zone.Value,
			MachineType: config.MachineType.Value,
			DiskSize:    config.DiskSize,
			DiskType:    config.DiskType.Value,
			Preemptible: config.Preemptible.Value != nil && *config.Preemptible.Value,
			Labels:      config.Labels,
			Tags:        config.Tags,
			CustomImage: config.CustomImage.Value,
		}

	case providerconfig.CloudProviderBaremetal:
		config := &baremetal.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse baremetal config: %w", err)
		}

		if config.Driver.Value == string(plugins.Tinkerbell) {
			var tinkerbellSpec apiv1.TinkerbellNodeSpec
			if config.DriverSpec.Raw == nil {
				return nil, fmt.Errorf("driver spec is empty")
			}

			if err := json.Unmarshal(config.DriverSpec.Raw, &tinkerbellSpec); err != nil {
				return nil, fmt.Errorf("failed to parse tinkerbell spec config: %w", err)
			}
			_, err := tinkerbellSpec.MarshalJSON()
			if err != nil {
				return nil, err
			}
			cloudSpec.Baremetal = &apiv1.BaremetalNodeSpec{
				Tinkerbell: &tinkerbellSpec,
			}
		}

	case providerconfig.CloudProviderKubeVirt:
		config := &kubevirt.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse kubevirt config: %w", err)
		}

		cloudSpec.Kubevirt = &apiv1.KubevirtNodeSpec{
			// Keep flavor for backward compatibility
			FlavorName:    config.VirtualMachine.Flavor.Name.Value,    //nolint:staticcheck
			FlavorProfile: config.VirtualMachine.Flavor.Profile.Value, //nolint:staticcheck

			Instancetype:                config.VirtualMachine.Instancetype,
			Preference:                  config.VirtualMachine.Preference,
			Memory:                      config.VirtualMachine.Template.Memory.Value,
			PrimaryDiskOSImage:          config.VirtualMachine.Template.PrimaryDisk.OsImage.Value,
			PrimaryDiskStorageClassName: config.VirtualMachine.Template.PrimaryDisk.StorageClassName.Value,
			PrimaryDiskSize:             config.VirtualMachine.Template.PrimaryDisk.Size.Value,
			NodeAffinityPreset: apiv1.NodeAffinityPreset{
				Type: config.Affinity.NodeAffinityPreset.Type.Value,
				Key:  config.Affinity.NodeAffinityPreset.Key.Value,
			},
		}
		if config.VirtualMachine.Template.VCPUs.Cores != 0 {
			cloudSpec.Kubevirt.CPUs = strconv.Itoa(config.VirtualMachine.Template.VCPUs.Cores)
		} else {
			cloudSpec.Kubevirt.CPUs = config.VirtualMachine.Template.CPUs.Value
		}
		cloudSpec.Kubevirt.SecondaryDisks = make([]apiv1.SecondaryDisks, 0, len(config.VirtualMachine.Template.SecondaryDisks))
		for _, sd := range config.VirtualMachine.Template.SecondaryDisks {
			secondaryDisk := apiv1.SecondaryDisks{Size: sd.Size.Value, StorageClassName: sd.StorageClassName.Value}
			cloudSpec.Kubevirt.SecondaryDisks = append(cloudSpec.Kubevirt.SecondaryDisks, secondaryDisk)
		}
		cloudSpec.Kubevirt.NodeAffinityPreset.Values = make([]string, 0, len(config.Affinity.NodeAffinityPreset.Values))
		for _, np := range config.Affinity.NodeAffinityPreset.Values {
			cloudSpec.Kubevirt.NodeAffinityPreset.Values = append(cloudSpec.Kubevirt.NodeAffinityPreset.Values, np.Value)
		}
		if config.VirtualMachine.ProviderNetwork != nil && config.VirtualMachine.ProviderNetwork.VPC.Subnet != nil {
			cloudSpec.Kubevirt.Subnet = config.VirtualMachine.ProviderNetwork.VPC.Subnet.Name
		}
		if config.VirtualMachine.EvictionStrategy != "" {
			cloudSpec.Kubevirt.EvictionStrategy = config.VirtualMachine.EvictionStrategy
		}

		cloudSpec.Kubevirt.TopologySpreadConstraints = make([]apiv1.TopologySpreadConstraint, 0, len(config.TopologySpreadConstraints))
		for _, tsc := range config.TopologySpreadConstraints {
			maxSkew, err := strconv.ParseInt(tsc.MaxSkew.Value, 10, 32)
			if err != nil {
				return nil, fmt.Errorf("failed to parse kubevirt config: %w", err)
			}
			constraint := apiv1.TopologySpreadConstraint{
				MaxSkew:           int(maxSkew),
				TopologyKey:       tsc.TopologyKey.Value,
				WhenUnsatisfiable: tsc.WhenUnsatisfiable.Value,
			}
			cloudSpec.Kubevirt.TopologySpreadConstraints = append(cloudSpec.Kubevirt.TopologySpreadConstraints, constraint)
		}
	case providerconfig.CloudProviderAlibaba:
		config := &alibaba.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse alibaba config: %w", err)
		}
		cloudSpec.Alibaba = &apiv1.AlibabaNodeSpec{
			InstanceType:            config.InstanceType.Value,
			DiskSize:                config.DiskSize.Value,
			DiskType:                config.DiskType.Value,
			VSwitchID:               config.VSwitchID.Value,
			InternetMaxBandwidthOut: config.InternetMaxBandwidthOut.Value,
			Labels:                  config.Labels,
			ZoneID:                  config.ZoneID.Value,
		}
	case providerconfig.CloudProviderAnexia:
		{
			config := &anexia.RawConfig{}
			if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
				return nil, fmt.Errorf("failed to parse anexia config: %w", err)
			}
			cloudSpec.Anexia = &apiv1.AnexiaNodeSpec{
				VlanID:        config.VlanID.Value,
				TemplateID:    config.TemplateID.Value,
				Template:      config.Template.Value,
				TemplateBuild: config.TemplateBuild.Value,
				CPUs:          config.CPUs,
				Memory:        int64(config.Memory),
			}

			if config.DiskSize > 0 {
				// migrate deprecated diskSize to disks config
				cloudSpec.Anexia.Disks = []apiv1.AnexiaDiskConfig{
					{Size: int64(config.DiskSize)},
				}
			} else if diskCount := len(config.Disks); diskCount > 0 {
				cloudSpec.Anexia.Disks = make([]apiv1.AnexiaDiskConfig, diskCount)

				for diskIndex, diskConfig := range config.Disks {
					cloudSpec.Anexia.Disks[diskIndex].Size = int64(diskConfig.Size)

					if diskConfig.PerformanceType.Value != "" {
						cloudSpec.Anexia.Disks[diskIndex].PerformanceType = ptr.To(diskConfig.PerformanceType.Value)
					}
				}
			}
		}
	case providerconfig.CloudProviderNutanix:
		{
			config := &nutanix.RawConfig{}
			if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
				return nil, fmt.Errorf("failed to parse nutanix config: %w", err)
			}

			// remove system categories
			categories := config.Categories
			delete(categories, nutanixprovider.ClusterCategoryName)
			delete(categories, nutanixprovider.ProjectCategoryName)

			cloudSpec.Nutanix = &apiv1.NutanixNodeSpec{
				SubnetName:     config.SubnetName.Value,
				ImageName:      config.ImageName.Value,
				Categories:     categories,
				CPUs:           config.CPUs,
				CPUCores:       config.CPUCores,
				CPUPassthrough: config.CPUPassthrough,
				MemoryMB:       config.MemoryMB,
				DiskSize:       config.DiskSize,
			}
		}
	case providerconfig.CloudProviderOpenNebula:
		config := &opennebula.RawConfig{}
		if err := json.Unmarshal(decodedProviderSpec.CloudProviderSpec.Raw, &config); err != nil {
			return nil, fmt.Errorf("failed to parse opennebula config: %w", err)
		}

		cloudSpec.OpenNebula = &apiv1.OpenNebulaNodeSpec{
			CPU:             config.CPU,
			VCPU:            config.VCPU,
			Memory:          config.Memory,
			Image:           config.Image.Value,
			Datastore:       config.Datastore.Value,
			DiskSize:        config.DiskSize,
			Network:         config.Network.Value,
			EnableVNC:       config.EnableVNC.Value,
			VMTemplateExtra: config.VMTemplateExtra,
		}
	default:
		return nil, fmt.Errorf("unknown cloud provider %q", decodedProviderSpec.CloudProvider)
	}

	return cloudSpec, nil
}

func extractSpotInstanceConfigs(config *aws.RawConfig) (*string, *string, *bool) {
	if config.IsSpotInstance != nil &&
		*config.IsSpotInstance &&
		config.SpotInstanceConfig != nil {
		return &config.SpotInstanceConfig.MaxPrice.Value,
			&config.SpotInstanceConfig.InterruptionBehavior.Value,
			config.SpotInstanceConfig.PersistentRequest.Value
	}

	return nil, nil, nil
}
