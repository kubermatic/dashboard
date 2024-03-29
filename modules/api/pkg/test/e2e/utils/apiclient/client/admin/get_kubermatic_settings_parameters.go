// Code generated by go-swagger; DO NOT EDIT.

package admin

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

// NewGetKubermaticSettingsParams creates a new GetKubermaticSettingsParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewGetKubermaticSettingsParams() *GetKubermaticSettingsParams {
	return &GetKubermaticSettingsParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewGetKubermaticSettingsParamsWithTimeout creates a new GetKubermaticSettingsParams object
// with the ability to set a timeout on a request.
func NewGetKubermaticSettingsParamsWithTimeout(timeout time.Duration) *GetKubermaticSettingsParams {
	return &GetKubermaticSettingsParams{
		timeout: timeout,
	}
}

// NewGetKubermaticSettingsParamsWithContext creates a new GetKubermaticSettingsParams object
// with the ability to set a context for a request.
func NewGetKubermaticSettingsParamsWithContext(ctx context.Context) *GetKubermaticSettingsParams {
	return &GetKubermaticSettingsParams{
		Context: ctx,
	}
}

// NewGetKubermaticSettingsParamsWithHTTPClient creates a new GetKubermaticSettingsParams object
// with the ability to set a custom HTTPClient for a request.
func NewGetKubermaticSettingsParamsWithHTTPClient(client *http.Client) *GetKubermaticSettingsParams {
	return &GetKubermaticSettingsParams{
		HTTPClient: client,
	}
}

/*
GetKubermaticSettingsParams contains all the parameters to send to the API endpoint

	for the get kubermatic settings operation.

	Typically these are written to a http.Request.
*/
type GetKubermaticSettingsParams struct {
	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the get kubermatic settings params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *GetKubermaticSettingsParams) WithDefaults() *GetKubermaticSettingsParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the get kubermatic settings params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *GetKubermaticSettingsParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the get kubermatic settings params
func (o *GetKubermaticSettingsParams) WithTimeout(timeout time.Duration) *GetKubermaticSettingsParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the get kubermatic settings params
func (o *GetKubermaticSettingsParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the get kubermatic settings params
func (o *GetKubermaticSettingsParams) WithContext(ctx context.Context) *GetKubermaticSettingsParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the get kubermatic settings params
func (o *GetKubermaticSettingsParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the get kubermatic settings params
func (o *GetKubermaticSettingsParams) WithHTTPClient(client *http.Client) *GetKubermaticSettingsParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the get kubermatic settings params
func (o *GetKubermaticSettingsParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WriteToRequest writes these params to a swagger request
func (o *GetKubermaticSettingsParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
