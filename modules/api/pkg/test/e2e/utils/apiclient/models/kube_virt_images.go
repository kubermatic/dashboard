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

// KubeVirtImages KubeVirtImages represents images with versions and their source.
//
// swagger:model KubeVirtImages
type KubeVirtImages struct {

	// operating systems
	OperatingSystems ImageListWithVersions `json:"operatingSystems,omitempty"`

	// source
	Source KubeVirtImageSourceType `json:"source,omitempty"`
}

// Validate validates this kube virt images
func (m *KubeVirtImages) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateOperatingSystems(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validateSource(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *KubeVirtImages) validateOperatingSystems(formats strfmt.Registry) error {
	if swag.IsZero(m.OperatingSystems) { // not required
		return nil
	}

	if m.OperatingSystems != nil {
		if err := m.OperatingSystems.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("operatingSystems")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("operatingSystems")
			}
			return err
		}
	}

	return nil
}

func (m *KubeVirtImages) validateSource(formats strfmt.Registry) error {
	if swag.IsZero(m.Source) { // not required
		return nil
	}

	if err := m.Source.Validate(formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("source")
		} else if ce, ok := err.(*errors.CompositeError); ok {
			return ce.ValidateName("source")
		}
		return err
	}

	return nil
}

// ContextValidate validate this kube virt images based on the context it is used
func (m *KubeVirtImages) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateOperatingSystems(ctx, formats); err != nil {
		res = append(res, err)
	}

	if err := m.contextValidateSource(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *KubeVirtImages) contextValidateOperatingSystems(ctx context.Context, formats strfmt.Registry) error {

	if err := m.OperatingSystems.ContextValidate(ctx, formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("operatingSystems")
		} else if ce, ok := err.(*errors.CompositeError); ok {
			return ce.ValidateName("operatingSystems")
		}
		return err
	}

	return nil
}

func (m *KubeVirtImages) contextValidateSource(ctx context.Context, formats strfmt.Registry) error {

	if err := m.Source.ContextValidate(ctx, formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("source")
		} else if ce, ok := err.(*errors.CompositeError); ok {
			return ce.ValidateName("source")
		}
		return err
	}

	return nil
}

// MarshalBinary interface implementation
func (m *KubeVirtImages) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *KubeVirtImages) UnmarshalBinary(b []byte) error {
	var res KubeVirtImages
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
