// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// OpenstackServerGroup OpenstackServerGroup is the object representing a openstack server group.
//
// swagger:model OpenstackServerGroup
type OpenstackServerGroup struct {

	// Id uniquely identifies the current server group
	ID string `json:"id,omitempty"`

	// Name is the name of the server group
	Name string `json:"name,omitempty"`
}

// Validate validates this openstack server group
func (m *OpenstackServerGroup) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this openstack server group based on context it is used
func (m *OpenstackServerGroup) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *OpenstackServerGroup) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *OpenstackServerGroup) UnmarshalBinary(b []byte) error {
	var res OpenstackServerGroup
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
