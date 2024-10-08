// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// BaremetalNodeSpec BaremetalNodeSpec baremetal specific node settings
//
// swagger:model BaremetalNodeSpec
type BaremetalNodeSpec struct {

	// tinkerbell
	Tinkerbell *TinkerbellNodeSpec `json:"tinkerbell,omitempty"`
}

// Validate validates this baremetal node spec
func (m *BaremetalNodeSpec) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateTinkerbell(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *BaremetalNodeSpec) validateTinkerbell(formats strfmt.Registry) error {
	if swag.IsZero(m.Tinkerbell) { // not required
		return nil
	}

	if m.Tinkerbell != nil {
		if err := m.Tinkerbell.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("tinkerbell")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("tinkerbell")
			}
			return err
		}
	}

	return nil
}

// ContextValidate validate this baremetal node spec based on the context it is used
func (m *BaremetalNodeSpec) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateTinkerbell(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *BaremetalNodeSpec) contextValidateTinkerbell(ctx context.Context, formats strfmt.Registry) error {

	if m.Tinkerbell != nil {
		if err := m.Tinkerbell.ContextValidate(ctx, formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("tinkerbell")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("tinkerbell")
			}
			return err
		}
	}

	return nil
}

// MarshalBinary interface implementation
func (m *BaremetalNodeSpec) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *BaremetalNodeSpec) UnmarshalBinary(b []byte) error {
	var res BaremetalNodeSpec
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
