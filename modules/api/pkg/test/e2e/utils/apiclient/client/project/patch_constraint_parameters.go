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

// NewPatchConstraintParams creates a new PatchConstraintParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewPatchConstraintParams() *PatchConstraintParams {
	return &PatchConstraintParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewPatchConstraintParamsWithTimeout creates a new PatchConstraintParams object
// with the ability to set a timeout on a request.
func NewPatchConstraintParamsWithTimeout(timeout time.Duration) *PatchConstraintParams {
	return &PatchConstraintParams{
		timeout: timeout,
	}
}

// NewPatchConstraintParamsWithContext creates a new PatchConstraintParams object
// with the ability to set a context for a request.
func NewPatchConstraintParamsWithContext(ctx context.Context) *PatchConstraintParams {
	return &PatchConstraintParams{
		Context: ctx,
	}
}

// NewPatchConstraintParamsWithHTTPClient creates a new PatchConstraintParams object
// with the ability to set a custom HTTPClient for a request.
func NewPatchConstraintParamsWithHTTPClient(client *http.Client) *PatchConstraintParams {
	return &PatchConstraintParams{
		HTTPClient: client,
	}
}

/*
PatchConstraintParams contains all the parameters to send to the API endpoint

	for the patch constraint operation.

	Typically these are written to a http.Request.
*/
type PatchConstraintParams struct {

	// Patch.
	Patch interface{}

	// ClusterID.
	ClusterID string

	// ConstraintName.
	Name string

	// ProjectID.
	ProjectID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the patch constraint params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *PatchConstraintParams) WithDefaults() *PatchConstraintParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the patch constraint params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *PatchConstraintParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the patch constraint params
func (o *PatchConstraintParams) WithTimeout(timeout time.Duration) *PatchConstraintParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the patch constraint params
func (o *PatchConstraintParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the patch constraint params
func (o *PatchConstraintParams) WithContext(ctx context.Context) *PatchConstraintParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the patch constraint params
func (o *PatchConstraintParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the patch constraint params
func (o *PatchConstraintParams) WithHTTPClient(client *http.Client) *PatchConstraintParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the patch constraint params
func (o *PatchConstraintParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithPatch adds the patch to the patch constraint params
func (o *PatchConstraintParams) WithPatch(patch interface{}) *PatchConstraintParams {
	o.SetPatch(patch)
	return o
}

// SetPatch adds the patch to the patch constraint params
func (o *PatchConstraintParams) SetPatch(patch interface{}) {
	o.Patch = patch
}

// WithClusterID adds the clusterID to the patch constraint params
func (o *PatchConstraintParams) WithClusterID(clusterID string) *PatchConstraintParams {
	o.SetClusterID(clusterID)
	return o
}

// SetClusterID adds the clusterId to the patch constraint params
func (o *PatchConstraintParams) SetClusterID(clusterID string) {
	o.ClusterID = clusterID
}

// WithName adds the constraintName to the patch constraint params
func (o *PatchConstraintParams) WithName(constraintName string) *PatchConstraintParams {
	o.SetName(constraintName)
	return o
}

// SetName adds the constraintName to the patch constraint params
func (o *PatchConstraintParams) SetName(constraintName string) {
	o.Name = constraintName
}

// WithProjectID adds the projectID to the patch constraint params
func (o *PatchConstraintParams) WithProjectID(projectID string) *PatchConstraintParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the patch constraint params
func (o *PatchConstraintParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *PatchConstraintParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error
	if o.Patch != nil {
		if err := r.SetBodyParam(o.Patch); err != nil {
			return err
		}
	}

	// path param cluster_id
	if err := r.SetPathParam("cluster_id", o.ClusterID); err != nil {
		return err
	}

	// path param constraint_name
	if err := r.SetPathParam("constraint_name", o.Name); err != nil {
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
