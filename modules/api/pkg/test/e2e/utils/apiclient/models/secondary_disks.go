// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// SecondaryDisks secondary disks
//
// swagger:model SecondaryDisks
type SecondaryDisks struct {

	// size
	Size string `json:"size,omitempty"`

	// storage class name
	StorageClassName string `json:"storageClassName,omitempty"`
}

// Validate validates this secondary disks
func (m *SecondaryDisks) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this secondary disks based on context it is used
func (m *SecondaryDisks) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *SecondaryDisks) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *SecondaryDisks) UnmarshalBinary(b []byte) error {
	var res SecondaryDisks
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
