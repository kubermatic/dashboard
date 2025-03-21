// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
)

// KubeVirtVolumeProvisioner KubeVirtVolumeProvisioner represents what is the provisioner of the storage class volume, whether it will be the csi driver
// and/or CDI for disk images.
//
// swagger:model KubeVirtVolumeProvisioner
type KubeVirtVolumeProvisioner string

// Validate validates this kube virt volume provisioner
func (m KubeVirtVolumeProvisioner) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this kube virt volume provisioner based on context it is used
func (m KubeVirtVolumeProvisioner) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}
