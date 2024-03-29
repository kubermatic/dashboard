// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// AnexiaTemplate AnexiaTemplate represents a object of Anexia template.
//
// swagger:model AnexiaTemplate
type AnexiaTemplate struct {

	// build
	Build string `json:"build,omitempty"`

	// ID
	ID string `json:"id,omitempty"`

	// name
	Name string `json:"name,omitempty"`
}

// Validate validates this anexia template
func (m *AnexiaTemplate) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this anexia template based on context it is used
func (m *AnexiaTemplate) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *AnexiaTemplate) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *AnexiaTemplate) UnmarshalBinary(b []byte) error {
	var res AnexiaTemplate
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
