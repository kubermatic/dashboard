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

// ProjectClusterList ProjectClusterList contains a list of clusters for a project and an optional error message.
//
// An error message is added to the response in case when there was a problem with creating client for any of seeds.
//
// swagger:model ProjectClusterList
type ProjectClusterList struct {

	// error message
	ErrorMessage string `json:"errorMessage,omitempty"`

	// clusters
	Clusters ClusterList `json:"clusters,omitempty"`
}

// Validate validates this project cluster list
func (m *ProjectClusterList) Validate(formats strfmt.Registry) error {
	var res []error

	if err := m.validateClusters(formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *ProjectClusterList) validateClusters(formats strfmt.Registry) error {
	if swag.IsZero(m.Clusters) { // not required
		return nil
	}

	if err := m.Clusters.Validate(formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("clusters")
		} else if ce, ok := err.(*errors.CompositeError); ok {
			return ce.ValidateName("clusters")
		}
		return err
	}

	return nil
}

// ContextValidate validate this project cluster list based on the context it is used
func (m *ProjectClusterList) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	var res []error

	if err := m.contextValidateClusters(ctx, formats); err != nil {
		res = append(res, err)
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}

func (m *ProjectClusterList) contextValidateClusters(ctx context.Context, formats strfmt.Registry) error {

	if err := m.Clusters.ContextValidate(ctx, formats); err != nil {
		if ve, ok := err.(*errors.Validation); ok {
			return ve.ValidateName("clusters")
		} else if ce, ok := err.(*errors.CompositeError); ok {
			return ce.ValidateName("clusters")
		}
		return err
	}

	return nil
}

// MarshalBinary interface implementation
func (m *ProjectClusterList) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *ProjectClusterList) UnmarshalBinary(b []byte) error {
	var res ProjectClusterList
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
