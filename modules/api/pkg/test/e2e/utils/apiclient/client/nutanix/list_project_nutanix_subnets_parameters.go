// Code generated by go-swagger; DO NOT EDIT.

package nutanix

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

// NewListProjectNutanixSubnetsParams creates a new ListProjectNutanixSubnetsParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListProjectNutanixSubnetsParams() *ListProjectNutanixSubnetsParams {
	return &ListProjectNutanixSubnetsParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListProjectNutanixSubnetsParamsWithTimeout creates a new ListProjectNutanixSubnetsParams object
// with the ability to set a timeout on a request.
func NewListProjectNutanixSubnetsParamsWithTimeout(timeout time.Duration) *ListProjectNutanixSubnetsParams {
	return &ListProjectNutanixSubnetsParams{
		timeout: timeout,
	}
}

// NewListProjectNutanixSubnetsParamsWithContext creates a new ListProjectNutanixSubnetsParams object
// with the ability to set a context for a request.
func NewListProjectNutanixSubnetsParamsWithContext(ctx context.Context) *ListProjectNutanixSubnetsParams {
	return &ListProjectNutanixSubnetsParams{
		Context: ctx,
	}
}

// NewListProjectNutanixSubnetsParamsWithHTTPClient creates a new ListProjectNutanixSubnetsParams object
// with the ability to set a custom HTTPClient for a request.
func NewListProjectNutanixSubnetsParamsWithHTTPClient(client *http.Client) *ListProjectNutanixSubnetsParams {
	return &ListProjectNutanixSubnetsParams{
		HTTPClient: client,
	}
}

/*
ListProjectNutanixSubnetsParams contains all the parameters to send to the API endpoint

	for the list project nutanix subnets operation.

	Typically these are written to a http.Request.
*/
type ListProjectNutanixSubnetsParams struct {

	// Credential.
	Credential *string

	// NutanixCluster.
	NutanixCluster string

	// NutanixPassword.
	NutanixPassword *string

	/* NutanixProject.

	   Project query parameter. Can be omitted to query subnets without project scope
	*/
	NutanixProject *string

	// NutanixProxyURL.
	NutanixProxyURL *string

	// NutanixUsername.
	NutanixUsername *string

	/* Dc.

	   KKP Datacenter to use for endpoint
	*/
	DC string

	// ProjectID.
	ProjectID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the list project nutanix subnets params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectNutanixSubnetsParams) WithDefaults() *ListProjectNutanixSubnetsParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list project nutanix subnets params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectNutanixSubnetsParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithTimeout(timeout time.Duration) *ListProjectNutanixSubnetsParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithContext(ctx context.Context) *ListProjectNutanixSubnetsParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithHTTPClient(client *http.Client) *ListProjectNutanixSubnetsParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithCredential adds the credential to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithCredential(credential *string) *ListProjectNutanixSubnetsParams {
	o.SetCredential(credential)
	return o
}

// SetCredential adds the credential to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetCredential(credential *string) {
	o.Credential = credential
}

// WithNutanixCluster adds the nutanixCluster to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithNutanixCluster(nutanixCluster string) *ListProjectNutanixSubnetsParams {
	o.SetNutanixCluster(nutanixCluster)
	return o
}

// SetNutanixCluster adds the nutanixCluster to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetNutanixCluster(nutanixCluster string) {
	o.NutanixCluster = nutanixCluster
}

// WithNutanixPassword adds the nutanixPassword to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithNutanixPassword(nutanixPassword *string) *ListProjectNutanixSubnetsParams {
	o.SetNutanixPassword(nutanixPassword)
	return o
}

// SetNutanixPassword adds the nutanixPassword to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetNutanixPassword(nutanixPassword *string) {
	o.NutanixPassword = nutanixPassword
}

// WithNutanixProject adds the nutanixProject to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithNutanixProject(nutanixProject *string) *ListProjectNutanixSubnetsParams {
	o.SetNutanixProject(nutanixProject)
	return o
}

// SetNutanixProject adds the nutanixProject to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetNutanixProject(nutanixProject *string) {
	o.NutanixProject = nutanixProject
}

// WithNutanixProxyURL adds the nutanixProxyURL to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithNutanixProxyURL(nutanixProxyURL *string) *ListProjectNutanixSubnetsParams {
	o.SetNutanixProxyURL(nutanixProxyURL)
	return o
}

// SetNutanixProxyURL adds the nutanixProxyUrl to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetNutanixProxyURL(nutanixProxyURL *string) {
	o.NutanixProxyURL = nutanixProxyURL
}

// WithNutanixUsername adds the nutanixUsername to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithNutanixUsername(nutanixUsername *string) *ListProjectNutanixSubnetsParams {
	o.SetNutanixUsername(nutanixUsername)
	return o
}

// SetNutanixUsername adds the nutanixUsername to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetNutanixUsername(nutanixUsername *string) {
	o.NutanixUsername = nutanixUsername
}

// WithDC adds the dc to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithDC(dc string) *ListProjectNutanixSubnetsParams {
	o.SetDC(dc)
	return o
}

// SetDC adds the dc to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetDC(dc string) {
	o.DC = dc
}

// WithProjectID adds the projectID to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) WithProjectID(projectID string) *ListProjectNutanixSubnetsParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the list project nutanix subnets params
func (o *ListProjectNutanixSubnetsParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *ListProjectNutanixSubnetsParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	if o.Credential != nil {

		// header param Credential
		if err := r.SetHeaderParam("Credential", *o.Credential); err != nil {
			return err
		}
	}

	// header param NutanixCluster
	if err := r.SetHeaderParam("NutanixCluster", o.NutanixCluster); err != nil {
		return err
	}

	if o.NutanixPassword != nil {

		// header param NutanixPassword
		if err := r.SetHeaderParam("NutanixPassword", *o.NutanixPassword); err != nil {
			return err
		}
	}

	if o.NutanixProject != nil {

		// header param NutanixProject
		if err := r.SetHeaderParam("NutanixProject", *o.NutanixProject); err != nil {
			return err
		}
	}

	if o.NutanixProxyURL != nil {

		// header param NutanixProxyURL
		if err := r.SetHeaderParam("NutanixProxyURL", *o.NutanixProxyURL); err != nil {
			return err
		}
	}

	if o.NutanixUsername != nil {

		// header param NutanixUsername
		if err := r.SetHeaderParam("NutanixUsername", *o.NutanixUsername); err != nil {
			return err
		}
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
