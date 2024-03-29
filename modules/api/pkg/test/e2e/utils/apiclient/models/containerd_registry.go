// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// ContainerdRegistry ContainerdRegistry defines endpoints and security for given container registry.
//
// swagger:model ContainerdRegistry
type ContainerdRegistry struct {

	// List of registry mirrors to use
	Mirrors []string `json:"mirrors"`
}

// Validate validates this containerd registry
func (m *ContainerdRegistry) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this containerd registry based on context it is used
func (m *ContainerdRegistry) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *ContainerdRegistry) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *ContainerdRegistry) UnmarshalBinary(b []byte) error {
	var res ContainerdRegistry
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
