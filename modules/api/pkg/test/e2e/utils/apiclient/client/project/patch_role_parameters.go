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

// NewPatchRoleParams creates a new PatchRoleParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewPatchRoleParams() *PatchRoleParams {
	return &PatchRoleParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewPatchRoleParamsWithTimeout creates a new PatchRoleParams object
// with the ability to set a timeout on a request.
func NewPatchRoleParamsWithTimeout(timeout time.Duration) *PatchRoleParams {
	return &PatchRoleParams{
		timeout: timeout,
	}
}

// NewPatchRoleParamsWithContext creates a new PatchRoleParams object
// with the ability to set a context for a request.
func NewPatchRoleParamsWithContext(ctx context.Context) *PatchRoleParams {
	return &PatchRoleParams{
		Context: ctx,
	}
}

// NewPatchRoleParamsWithHTTPClient creates a new PatchRoleParams object
// with the ability to set a custom HTTPClient for a request.
func NewPatchRoleParamsWithHTTPClient(client *http.Client) *PatchRoleParams {
	return &PatchRoleParams{
		HTTPClient: client,
	}
}

/*
PatchRoleParams contains all the parameters to send to the API endpoint

	for the patch role operation.

	Typically these are written to a http.Request.
*/
type PatchRoleParams struct {

	// Patch.
	Patch interface{}

	// ClusterID.
	ClusterID string

	// Dc.
	DC string

	// Namespace.
	Namespace string

	// ProjectID.
	ProjectID string

	// RoleID.
	RoleID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the patch role params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *PatchRoleParams) WithDefaults() *PatchRoleParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the patch role params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *PatchRoleParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the patch role params
func (o *PatchRoleParams) WithTimeout(timeout time.Duration) *PatchRoleParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the patch role params
func (o *PatchRoleParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the patch role params
func (o *PatchRoleParams) WithContext(ctx context.Context) *PatchRoleParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the patch role params
func (o *PatchRoleParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the patch role params
func (o *PatchRoleParams) WithHTTPClient(client *http.Client) *PatchRoleParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the patch role params
func (o *PatchRoleParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithPatch adds the patch to the patch role params
func (o *PatchRoleParams) WithPatch(patch interface{}) *PatchRoleParams {
	o.SetPatch(patch)
	return o
}

// SetPatch adds the patch to the patch role params
func (o *PatchRoleParams) SetPatch(patch interface{}) {
	o.Patch = patch
}

// WithClusterID adds the clusterID to the patch role params
func (o *PatchRoleParams) WithClusterID(clusterID string) *PatchRoleParams {
	o.SetClusterID(clusterID)
	return o
}

// SetClusterID adds the clusterId to the patch role params
func (o *PatchRoleParams) SetClusterID(clusterID string) {
	o.ClusterID = clusterID
}

// WithDC adds the dc to the patch role params
func (o *PatchRoleParams) WithDC(dc string) *PatchRoleParams {
	o.SetDC(dc)
	return o
}

// SetDC adds the dc to the patch role params
func (o *PatchRoleParams) SetDC(dc string) {
	o.DC = dc
}

// WithNamespace adds the namespace to the patch role params
func (o *PatchRoleParams) WithNamespace(namespace string) *PatchRoleParams {
	o.SetNamespace(namespace)
	return o
}

// SetNamespace adds the namespace to the patch role params
func (o *PatchRoleParams) SetNamespace(namespace string) {
	o.Namespace = namespace
}

// WithProjectID adds the projectID to the patch role params
func (o *PatchRoleParams) WithProjectID(projectID string) *PatchRoleParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the patch role params
func (o *PatchRoleParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WithRoleID adds the roleID to the patch role params
func (o *PatchRoleParams) WithRoleID(roleID string) *PatchRoleParams {
	o.SetRoleID(roleID)
	return o
}

// SetRoleID adds the roleId to the patch role params
func (o *PatchRoleParams) SetRoleID(roleID string) {
	o.RoleID = roleID
}

// WriteToRequest writes these params to a swagger request
func (o *PatchRoleParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

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

	// path param dc
	if err := r.SetPathParam("dc", o.DC); err != nil {
		return err
	}

	// path param namespace
	if err := r.SetPathParam("namespace", o.Namespace); err != nil {
		return err
	}

	// path param project_id
	if err := r.SetPathParam("project_id", o.ProjectID); err != nil {
		return err
	}

	// path param role_id
	if err := r.SetPathParam("role_id", o.RoleID); err != nil {
		return err
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
