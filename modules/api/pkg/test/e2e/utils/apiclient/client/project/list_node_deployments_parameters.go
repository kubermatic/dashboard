// Code generated by go-swagger; DO NOT EDIT.

package project

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

// NewListNodeDeploymentsParams creates a new ListNodeDeploymentsParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListNodeDeploymentsParams() *ListNodeDeploymentsParams {
	return &ListNodeDeploymentsParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListNodeDeploymentsParamsWithTimeout creates a new ListNodeDeploymentsParams object
// with the ability to set a timeout on a request.
func NewListNodeDeploymentsParamsWithTimeout(timeout time.Duration) *ListNodeDeploymentsParams {
	return &ListNodeDeploymentsParams{
		timeout: timeout,
	}
}

// NewListNodeDeploymentsParamsWithContext creates a new ListNodeDeploymentsParams object
// with the ability to set a context for a request.
func NewListNodeDeploymentsParamsWithContext(ctx context.Context) *ListNodeDeploymentsParams {
	return &ListNodeDeploymentsParams{
		Context: ctx,
	}
}

// NewListNodeDeploymentsParamsWithHTTPClient creates a new ListNodeDeploymentsParams object
// with the ability to set a custom HTTPClient for a request.
func NewListNodeDeploymentsParamsWithHTTPClient(client *http.Client) *ListNodeDeploymentsParams {
	return &ListNodeDeploymentsParams{
		HTTPClient: client,
	}
}

/*
ListNodeDeploymentsParams contains all the parameters to send to the API endpoint

	for the list node deployments operation.

	Typically these are written to a http.Request.
*/
type ListNodeDeploymentsParams struct {

	// ClusterID.
	ClusterID string

	// Dc.
	DC string

	// ProjectID.
	ProjectID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the list node deployments params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListNodeDeploymentsParams) WithDefaults() *ListNodeDeploymentsParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list node deployments params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListNodeDeploymentsParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list node deployments params
func (o *ListNodeDeploymentsParams) WithTimeout(timeout time.Duration) *ListNodeDeploymentsParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list node deployments params
func (o *ListNodeDeploymentsParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list node deployments params
func (o *ListNodeDeploymentsParams) WithContext(ctx context.Context) *ListNodeDeploymentsParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list node deployments params
func (o *ListNodeDeploymentsParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list node deployments params
func (o *ListNodeDeploymentsParams) WithHTTPClient(client *http.Client) *ListNodeDeploymentsParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list node deployments params
func (o *ListNodeDeploymentsParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithClusterID adds the clusterID to the list node deployments params
func (o *ListNodeDeploymentsParams) WithClusterID(clusterID string) *ListNodeDeploymentsParams {
	o.SetClusterID(clusterID)
	return o
}

// SetClusterID adds the clusterId to the list node deployments params
func (o *ListNodeDeploymentsParams) SetClusterID(clusterID string) {
	o.ClusterID = clusterID
}

// WithDC adds the dc to the list node deployments params
func (o *ListNodeDeploymentsParams) WithDC(dc string) *ListNodeDeploymentsParams {
	o.SetDC(dc)
	return o
}

// SetDC adds the dc to the list node deployments params
func (o *ListNodeDeploymentsParams) SetDC(dc string) {
	o.DC = dc
}

// WithProjectID adds the projectID to the list node deployments params
func (o *ListNodeDeploymentsParams) WithProjectID(projectID string) *ListNodeDeploymentsParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the list node deployments params
func (o *ListNodeDeploymentsParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *ListNodeDeploymentsParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	// path param cluster_id
	if err := r.SetPathParam("cluster_id", o.ClusterID); err != nil {
		return err
	}

	// path param dc
	if err := r.SetPathParam("dc", o.DC); err != nil {
		return err
	}

	// path param project_id
	if err := r.SetPathParam("project_id", o.ProjectID); err != nil {
		return err
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
