// Code generated by go-swagger; DO NOT EDIT.

package addon

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"context"
	"net/http"
	"time"

	"github.com/go-openapi/errors"
	"github.com/go-openapi/runtime"
	cr "github.com/go-openapi/runtime/client"
	"github.com/go-openapi/strfmt"
)

// NewListAccessibleAddonsParams creates a new ListAccessibleAddonsParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListAccessibleAddonsParams() *ListAccessibleAddonsParams {
	return &ListAccessibleAddonsParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListAccessibleAddonsParamsWithTimeout creates a new ListAccessibleAddonsParams object
// with the ability to set a timeout on a request.
func NewListAccessibleAddonsParamsWithTimeout(timeout time.Duration) *ListAccessibleAddonsParams {
	return &ListAccessibleAddonsParams{
		timeout: timeout,
	}
}

// NewListAccessibleAddonsParamsWithContext creates a new ListAccessibleAddonsParams object
// with the ability to set a context for a request.
func NewListAccessibleAddonsParamsWithContext(ctx context.Context) *ListAccessibleAddonsParams {
	return &ListAccessibleAddonsParams{
		Context: ctx,
	}
}

// NewListAccessibleAddonsParamsWithHTTPClient creates a new ListAccessibleAddonsParams object
// with the ability to set a custom HTTPClient for a request.
func NewListAccessibleAddonsParamsWithHTTPClient(client *http.Client) *ListAccessibleAddonsParams {
	return &ListAccessibleAddonsParams{
		HTTPClient: client,
	}
}

/*
ListAccessibleAddonsParams contains all the parameters to send to the API endpoint

	for the list accessible addons operation.

	Typically these are written to a http.Request.
*/
type ListAccessibleAddonsParams struct {
	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the list accessible addons params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListAccessibleAddonsParams) WithDefaults() *ListAccessibleAddonsParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list accessible addons params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListAccessibleAddonsParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list accessible addons params
func (o *ListAccessibleAddonsParams) WithTimeout(timeout time.Duration) *ListAccessibleAddonsParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list accessible addons params
func (o *ListAccessibleAddonsParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list accessible addons params
func (o *ListAccessibleAddonsParams) WithContext(ctx context.Context) *ListAccessibleAddonsParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list accessible addons params
func (o *ListAccessibleAddonsParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list accessible addons params
func (o *ListAccessibleAddonsParams) WithHTTPClient(client *http.Client) *ListAccessibleAddonsParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list accessible addons params
func (o *ListAccessibleAddonsParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WriteToRequest writes these params to a swagger request
func (o *ListAccessibleAddonsParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
