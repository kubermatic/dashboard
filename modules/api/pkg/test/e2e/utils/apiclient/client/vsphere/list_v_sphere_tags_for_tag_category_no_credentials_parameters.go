// Code generated by go-swagger; DO NOT EDIT.

package vsphere

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

// NewListVSphereTagsForTagCategoryNoCredentialsParams creates a new ListVSphereTagsForTagCategoryNoCredentialsParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListVSphereTagsForTagCategoryNoCredentialsParams() *ListVSphereTagsForTagCategoryNoCredentialsParams {
	return &ListVSphereTagsForTagCategoryNoCredentialsParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListVSphereTagsForTagCategoryNoCredentialsParamsWithTimeout creates a new ListVSphereTagsForTagCategoryNoCredentialsParams object
// with the ability to set a timeout on a request.
func NewListVSphereTagsForTagCategoryNoCredentialsParamsWithTimeout(timeout time.Duration) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	return &ListVSphereTagsForTagCategoryNoCredentialsParams{
		timeout: timeout,
	}
}

// NewListVSphereTagsForTagCategoryNoCredentialsParamsWithContext creates a new ListVSphereTagsForTagCategoryNoCredentialsParams object
// with the ability to set a context for a request.
func NewListVSphereTagsForTagCategoryNoCredentialsParamsWithContext(ctx context.Context) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	return &ListVSphereTagsForTagCategoryNoCredentialsParams{
		Context: ctx,
	}
}

// NewListVSphereTagsForTagCategoryNoCredentialsParamsWithHTTPClient creates a new ListVSphereTagsForTagCategoryNoCredentialsParams object
// with the ability to set a custom HTTPClient for a request.
func NewListVSphereTagsForTagCategoryNoCredentialsParamsWithHTTPClient(client *http.Client) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	return &ListVSphereTagsForTagCategoryNoCredentialsParams{
		HTTPClient: client,
	}
}

/*
ListVSphereTagsForTagCategoryNoCredentialsParams contains all the parameters to send to the API endpoint

	for the list v sphere tags for tag category no credentials operation.

	Typically these are written to a http.Request.
*/
type ListVSphereTagsForTagCategoryNoCredentialsParams struct {

	// ClusterID.
	ClusterID string

	// ProjectID.
	ProjectID string

	// TagCategory.
	TagCategory string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the list v sphere tags for tag category no credentials params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithDefaults() *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list v sphere tags for tag category no credentials params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithTimeout(timeout time.Duration) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithContext(ctx context.Context) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithHTTPClient(client *http.Client) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithClusterID adds the clusterID to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithClusterID(clusterID string) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetClusterID(clusterID)
	return o
}

// SetClusterID adds the clusterId to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetClusterID(clusterID string) {
	o.ClusterID = clusterID
}

// WithProjectID adds the projectID to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithProjectID(projectID string) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WithTagCategory adds the tagCategory to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WithTagCategory(tagCategory string) *ListVSphereTagsForTagCategoryNoCredentialsParams {
	o.SetTagCategory(tagCategory)
	return o
}

// SetTagCategory adds the tagCategory to the list v sphere tags for tag category no credentials params
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) SetTagCategory(tagCategory string) {
	o.TagCategory = tagCategory
}

// WriteToRequest writes these params to a swagger request
func (o *ListVSphereTagsForTagCategoryNoCredentialsParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	// path param cluster_id
	if err := r.SetPathParam("cluster_id", o.ClusterID); err != nil {
		return err
	}

	// path param project_id
	if err := r.SetPathParam("project_id", o.ProjectID); err != nil {
		return err
	}

	// path param tag_category
	if err := r.SetPathParam("tag_category", o.TagCategory); err != nil {
		return err
	}

	if len(res) > 0 {
		return errors.CompositeValidationError(res...)
	}
	return nil
}
