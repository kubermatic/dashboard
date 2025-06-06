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

// PolicyBindingSpec PolicyBindingSpec describes how and where to apply the referenced PolicyTemplate.
//
// swagger:model PolicyBindingSpec
type PolicyBindingSpec struct {

	// kyverno policy namespace
	KyvernoPolicyNamespace *KyvernoPolicyNamespace `json:"kyvernoPolicyNamespace,omitempty"`

	// policy template ref
	PolicyTemplateRef *ObjectReference `json:"policyTemplateRef,omitempty"`
}

// Validate validates this policy binding spec
func (m *PolicyBindingSpec) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateKyvernoPolicyNamespace(formats); err != nil {
		res = append(res, err)
	}

	if err := m.validatePolicyTemplateRef(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *PolicyBindingSpec) validateKyvernoPolicyNamespace(formats strfmt.Registry) error {
	if swag.IsZero(m.KyvernoPolicyNamespace) { // not required
		return nil
	}

	if m.KyvernoPolicyNamespace != nil {
		if err := m.KyvernoPolicyNamespace.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("kyvernoPolicyNamespace")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("kyvernoPolicyNamespace")
			}
			return err
		}
	}

	return nil
}

func (m *PolicyBindingSpec) validatePolicyTemplateRef(formats strfmt.Registry) error {
	if swag.IsZero(m.PolicyTemplateRef) { // not required
		return nil
	}

	if m.PolicyTemplateRef != nil {
		if err := m.PolicyTemplateRef.Validate(formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("policyTemplateRef")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("policyTemplateRef")
			}
			return err
		}
	}

	return nil
}

// ContextValidate validate this policy binding spec based on the context it is used
func (m *PolicyBindingSpec) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateKyvernoPolicyNamespace(ctx, formats); err != nil {
		res = append(res, err)
	}

	if err := m.contextValidatePolicyTemplateRef(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *PolicyBindingSpec) contextValidateKyvernoPolicyNamespace(ctx context.Context, formats strfmt.Registry) error {

	if m.KyvernoPolicyNamespace != nil {
		if err := m.KyvernoPolicyNamespace.ContextValidate(ctx, formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("kyvernoPolicyNamespace")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("kyvernoPolicyNamespace")
			}
			return err
		}
	}

	return nil
}

func (m *PolicyBindingSpec) contextValidatePolicyTemplateRef(ctx context.Context, formats strfmt.Registry) error {

	if m.PolicyTemplateRef != nil {
		if err := m.PolicyTemplateRef.ContextValidate(ctx, formats); err != nil {
			if ve, ok := err.(*errors.Validation); ok {
				return ve.ValidateName("policyTemplateRef")
			} else if ce, ok := err.(*errors.CompositeError); ok {
				return ce.ValidateName("policyTemplateRef")
			}
			return err
		}
	}

	return nil
}

// MarshalBinary interface implementation
func (m *PolicyBindingSpec) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *PolicyBindingSpec) UnmarshalBinary(b []byte) error {
	var res PolicyBindingSpec
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
