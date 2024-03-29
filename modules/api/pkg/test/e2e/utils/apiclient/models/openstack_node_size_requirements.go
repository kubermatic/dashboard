// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// OpenstackNodeSizeRequirements openstack node size requirements
//
// swagger:model OpenstackNodeSizeRequirements
type OpenstackNodeSizeRequirements struct {

	// MinimumMemory is the minimum required amount of memory, measured in MB
	MinimumMemory int64 `json:"minimumMemory,omitempty"`

	// VCPUs is the minimum required amount of (virtual) CPUs
	MinimumVCPUs int64 `json:"minimumVCPUs,omitempty"`
}

// Validate validates this openstack node size requirements
func (m *OpenstackNodeSizeRequirements) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this openstack node size requirements based on context it is used
func (m *OpenstackNodeSizeRequirements) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *OpenstackNodeSizeRequirements) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *OpenstackNodeSizeRequirements) UnmarshalBinary(b []byte) error {
	var res OpenstackNodeSizeRequirements
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
