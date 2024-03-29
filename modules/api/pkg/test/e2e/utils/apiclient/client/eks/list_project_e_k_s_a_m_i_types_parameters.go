// Code generated by go-swagger; DO NOT EDIT.

package eks

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

// NewListProjectEKSAMITypesParams creates a new ListProjectEKSAMITypesParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListProjectEKSAMITypesParams() *ListProjectEKSAMITypesParams {
	return &ListProjectEKSAMITypesParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListProjectEKSAMITypesParamsWithTimeout creates a new ListProjectEKSAMITypesParams object
// with the ability to set a timeout on a request.
func NewListProjectEKSAMITypesParamsWithTimeout(timeout time.Duration) *ListProjectEKSAMITypesParams {
	return &ListProjectEKSAMITypesParams{
		timeout: timeout,
	}
}

// NewListProjectEKSAMITypesParamsWithContext creates a new ListProjectEKSAMITypesParams object
// with the ability to set a context for a request.
func NewListProjectEKSAMITypesParamsWithContext(ctx context.Context) *ListProjectEKSAMITypesParams {
	return &ListProjectEKSAMITypesParams{
		Context: ctx,
	}
}

// NewListProjectEKSAMITypesParamsWithHTTPClient creates a new ListProjectEKSAMITypesParams object
// with the ability to set a custom HTTPClient for a request.
func NewListProjectEKSAMITypesParamsWithHTTPClient(client *http.Client) *ListProjectEKSAMITypesParams {
	return &ListProjectEKSAMITypesParams{
		HTTPClient: client,
	}
}

/*
ListProjectEKSAMITypesParams contains all the parameters to send to the API endpoint

	for the list project e k s a m i types operation.

	Typically these are written to a http.Request.
*/
type ListProjectEKSAMITypesParams struct {

	// ProjectID.
	ProjectID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the list project e k s a m i types params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectEKSAMITypesParams) WithDefaults() *ListProjectEKSAMITypesParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list project e k s a m i types params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectEKSAMITypesParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) WithTimeout(timeout time.Duration) *ListProjectEKSAMITypesParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) WithContext(ctx context.Context) *ListProjectEKSAMITypesParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) WithHTTPClient(client *http.Client) *ListProjectEKSAMITypesParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithProjectID adds the projectID to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) WithProjectID(projectID string) *ListProjectEKSAMITypesParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the list project e k s a m i types params
func (o *ListProjectEKSAMITypesParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *ListProjectEKSAMITypesParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	// path param project_id
	if err := r.SetPathParam("project_id", o.ProjectID); err != nil {
		return err
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
