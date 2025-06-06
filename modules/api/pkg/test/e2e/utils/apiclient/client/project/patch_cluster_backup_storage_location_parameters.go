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

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/models"
)

// NewPatchClusterBackupStorageLocationParams creates a new PatchClusterBackupStorageLocationParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewPatchClusterBackupStorageLocationParams() *PatchClusterBackupStorageLocationParams {
	return &PatchClusterBackupStorageLocationParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewPatchClusterBackupStorageLocationParamsWithTimeout creates a new PatchClusterBackupStorageLocationParams object
// with the ability to set a timeout on a request.
func NewPatchClusterBackupStorageLocationParamsWithTimeout(timeout time.Duration) *PatchClusterBackupStorageLocationParams {
	return &PatchClusterBackupStorageLocationParams{
		timeout: timeout,
	}
}

// NewPatchClusterBackupStorageLocationParamsWithContext creates a new PatchClusterBackupStorageLocationParams object
// with the ability to set a context for a request.
func NewPatchClusterBackupStorageLocationParamsWithContext(ctx context.Context) *PatchClusterBackupStorageLocationParams {
	return &PatchClusterBackupStorageLocationParams{
		Context: ctx,
	}
}

// NewPatchClusterBackupStorageLocationParamsWithHTTPClient creates a new PatchClusterBackupStorageLocationParams object
// with the ability to set a custom HTTPClient for a request.
func NewPatchClusterBackupStorageLocationParamsWithHTTPClient(client *http.Client) *PatchClusterBackupStorageLocationParams {
	return &PatchClusterBackupStorageLocationParams{
		HTTPClient: client,
	}
}

/*
PatchClusterBackupStorageLocationParams contains all the parameters to send to the API endpoint

	for the patch cluster backup storage location operation.

	Typically these are written to a http.Request.
*/
type PatchClusterBackupStorageLocationParams struct {

	// Body.
	Body *models.CbslBody

	// CbslName.
	ClusterBackupStorageLocationName string

	// ProjectID.
	ProjectID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the patch cluster backup storage location params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *PatchClusterBackupStorageLocationParams) WithDefaults() *PatchClusterBackupStorageLocationParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the patch cluster backup storage location params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *PatchClusterBackupStorageLocationParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) WithTimeout(timeout time.Duration) *PatchClusterBackupStorageLocationParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) WithContext(ctx context.Context) *PatchClusterBackupStorageLocationParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) WithHTTPClient(client *http.Client) *PatchClusterBackupStorageLocationParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithBody adds the body to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) WithBody(body *models.CbslBody) *PatchClusterBackupStorageLocationParams {
	o.SetBody(body)
	return o
}

// SetBody adds the body to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) SetBody(body *models.CbslBody) {
	o.Body = body
}

// WithClusterBackupStorageLocationName adds the cbslName to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) WithClusterBackupStorageLocationName(cbslName string) *PatchClusterBackupStorageLocationParams {
	o.SetClusterBackupStorageLocationName(cbslName)
	return o
}

// SetClusterBackupStorageLocationName adds the cbslName to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) SetClusterBackupStorageLocationName(cbslName string) {
	o.ClusterBackupStorageLocationName = cbslName
}

// WithProjectID adds the projectID to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) WithProjectID(projectID string) *PatchClusterBackupStorageLocationParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the patch cluster backup storage location params
func (o *PatchClusterBackupStorageLocationParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *PatchClusterBackupStorageLocationParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error
	if o.Body != nil {
		if err := r.SetBodyParam(o.Body); err != nil {
			return err
		}
	}

	// path param cbsl_name
	if err := r.SetPathParam("cbsl_name", o.ClusterBackupStorageLocationName); err != nil {
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
