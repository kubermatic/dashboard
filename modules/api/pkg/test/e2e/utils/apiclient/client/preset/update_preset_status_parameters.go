// Code generated by go-swagger; DO NOT EDIT.

package preset

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

// NewUpdatePresetStatusParams creates a new UpdatePresetStatusParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewUpdatePresetStatusParams() *UpdatePresetStatusParams {
	return &UpdatePresetStatusParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewUpdatePresetStatusParamsWithTimeout creates a new UpdatePresetStatusParams object
// with the ability to set a timeout on a request.
func NewUpdatePresetStatusParamsWithTimeout(timeout time.Duration) *UpdatePresetStatusParams {
	return &UpdatePresetStatusParams{
		timeout: timeout,
	}
}

// NewUpdatePresetStatusParamsWithContext creates a new UpdatePresetStatusParams object
// with the ability to set a context for a request.
func NewUpdatePresetStatusParamsWithContext(ctx context.Context) *UpdatePresetStatusParams {
	return &UpdatePresetStatusParams{
		Context: ctx,
	}
}

// NewUpdatePresetStatusParamsWithHTTPClient creates a new UpdatePresetStatusParams object
// with the ability to set a custom HTTPClient for a request.
func NewUpdatePresetStatusParamsWithHTTPClient(client *http.Client) *UpdatePresetStatusParams {
	return &UpdatePresetStatusParams{
		HTTPClient: client,
	}
}

/*
UpdatePresetStatusParams contains all the parameters to send to the API endpoint

	for the update preset status operation.

	Typically these are written to a http.Request.
*/
type UpdatePresetStatusParams struct {

	// Body.
	Body UpdatePresetStatusBody

	// PresetName.
	PresetName string

	// Provider.
	Provider *string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the update preset status params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *UpdatePresetStatusParams) WithDefaults() *UpdatePresetStatusParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the update preset status params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *UpdatePresetStatusParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the update preset status params
func (o *UpdatePresetStatusParams) WithTimeout(timeout time.Duration) *UpdatePresetStatusParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the update preset status params
func (o *UpdatePresetStatusParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the update preset status params
func (o *UpdatePresetStatusParams) WithContext(ctx context.Context) *UpdatePresetStatusParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the update preset status params
func (o *UpdatePresetStatusParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the update preset status params
func (o *UpdatePresetStatusParams) WithHTTPClient(client *http.Client) *UpdatePresetStatusParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the update preset status params
func (o *UpdatePresetStatusParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithBody adds the body to the update preset status params
func (o *UpdatePresetStatusParams) WithBody(body UpdatePresetStatusBody) *UpdatePresetStatusParams {
	o.SetBody(body)
	return o
}

// SetBody adds the body to the update preset status params
func (o *UpdatePresetStatusParams) SetBody(body UpdatePresetStatusBody) {
	o.Body = body
}

// WithPresetName adds the presetName to the update preset status params
func (o *UpdatePresetStatusParams) WithPresetName(presetName string) *UpdatePresetStatusParams {
	o.SetPresetName(presetName)
	return o
}

// SetPresetName adds the presetName to the update preset status params
func (o *UpdatePresetStatusParams) SetPresetName(presetName string) {
	o.PresetName = presetName
}

// WithProvider adds the provider to the update preset status params
func (o *UpdatePresetStatusParams) WithProvider(provider *string) *UpdatePresetStatusParams {
	o.SetProvider(provider)
	return o
}

// SetProvider adds the provider to the update preset status params
func (o *UpdatePresetStatusParams) SetProvider(provider *string) {
	o.Provider = provider
}

// WriteToRequest writes these params to a swagger request
func (o *UpdatePresetStatusParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error
	if err := r.SetBodyParam(o.Body); err != nil {
		return err
	}

	// path param preset_name
	if err := r.SetPathParam("preset_name", o.PresetName); err != nil {
		return err
	}

	if o.Provider != nil {

		// query param provider
		var qrProvider string

		if o.Provider != nil {
			qrProvider = *o.Provider
		}
		qProvider := qrProvider
		if qProvider != "" {

			if err := r.SetQueryParam("provider", qProvider); err != nil {
				return err
			}
		}
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
