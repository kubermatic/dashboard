// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// StorageClass StorageClass represents a Kubernetes StorageClass
//
// swagger:model StorageClass
type StorageClass struct {

	// name
	Name string `json:"name,omitempty"`
}

// Validate validates this storage class
func (m *StorageClass) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this storage class based on context it is used
func (m *StorageClass) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *StorageClass) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *StorageClass) UnmarshalBinary(b []byte) error {
	var res StorageClass
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
