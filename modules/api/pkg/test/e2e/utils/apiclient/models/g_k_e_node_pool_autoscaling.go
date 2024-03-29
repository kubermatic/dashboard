// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
)

// GKENodePoolAutoscaling GKENodePoolAutoscaling contains information
// required by cluster autoscaler to adjust the size of the node pool to
// the current cluster usage.
//
// swagger:model GKENodePoolAutoscaling
type GKENodePoolAutoscaling struct {

	// Autoprovisioned: Can this node pool be deleted automatically.
	Autoprovisioned bool `json:"autoprovisioned,omitempty"`

	// Enabled: Is autoscaling enabled for this node pool.
	Enabled bool `json:"enabled,omitempty"`

	// MaxNodeCount: Maximum number of nodes in the NodePool. Must be >=
	// min_node_count. There has to enough quota to scale up the cluster.
	MaxNodeCount int64 `json:"maxNodeCount,omitempty"`

	// MinNodeCount: Minimum number of nodes in the NodePool. Must be >= 1
	// and <= max_node_count.
	MinNodeCount int64 `json:"minNodeCount,omitempty"`
}

// Validate validates this g k e node pool autoscaling
func (m *GKENodePoolAutoscaling) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this g k e node pool autoscaling based on context it is used
func (m *GKENodePoolAutoscaling) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}

// MarshalBinary interface implementation
func (m *GKENodePoolAutoscaling) MarshalBinary() ([]byte, error) {
	if m == nil {
		return nil, nil
	}
	return swag.WriteJSON(m)
}

// UnmarshalBinary interface implementation
func (m *GKENodePoolAutoscaling) UnmarshalBinary(b []byte) error {
	var res GKENodePoolAutoscaling
	if err := swag.ReadJSON(b, &res); err != nil {
		return err
	}
	*m = res
	return nil
}
