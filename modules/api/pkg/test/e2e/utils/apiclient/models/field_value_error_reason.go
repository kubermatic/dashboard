// Code generated by go-swagger; DO NOT EDIT.

package models

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"

	"github.com/go-openapi/strfmt"
)

// FieldValueErrorReason FieldValueErrorReason is a machine-readable value providing more detail about why a field failed the validation.
//
// +enum
//
// swagger:model FieldValueErrorReason
type FieldValueErrorReason string

// Validate validates this field value error reason
func (m FieldValueErrorReason) Validate(formats strfmt.Registry) error {
	return nil
}

// ContextValidate validates this field value error reason based on context it is used
func (m FieldValueErrorReason) ContextValidate(ctx context.Context, formats strfmt.Registry) error {
	return nil
}
