// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// AzureSize AzureSize is the object representing Azure VM sizes.
//
// swagger:model AzureSize
type AzureSize struct {

	// accelerated networking enabled
	AcceleratedNetworkingEnabled bool `json:"acceleratedNetworkingEnabled,omitempty"`

	// max data disk count
	MaxDataDiskCount int32 `json:"maxDataDiskCount,omitempty"`

	// memory in m b
	MemoryInMB int32 `json:"memoryInMB,omitempty"`

	// name
	Name string `json:"name,omitempty"`

	// number of cores
	NumberOfCores int32 `json:"numberOfCores,omitempty"`

	// number of g p us
	NumberOfGPUs int32 `json:"numberOfGPUs,omitempty"`

	// os disk size in m b
	OsDiskSizeInMB int32 `json:"osDiskSizeInMB,omitempty"`

	// resource disk size in m b
	ResourceDiskSizeInMB int32 `json:"resourceDiskSizeInMB,omitempty"`
}

// Validate validates this azure size
func (m *AzureSize) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this azure size based on context it is used
func (m *AzureSize) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *AzureSize) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *AzureSize) UnmarshalBinary(b []byte) error {
	var res AzureSize
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
