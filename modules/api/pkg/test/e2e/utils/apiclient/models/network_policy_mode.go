// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
)

// NetworkPolicyMode NetworkPolicyMode maps directly to the values supported by the kubermatic network policy mode for kubevirt
// worker nodes in kube-ovn environments.
// +kubebuilder:validation:Enum=deny;allow
//
// swagger:model NetworkPolicyMode
type NetworkPolicyMode string

// Validate validates this network policy mode
func (m NetworkPolicyMode) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this network policy mode based on context it is used
func (m NetworkPolicyMode) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}
