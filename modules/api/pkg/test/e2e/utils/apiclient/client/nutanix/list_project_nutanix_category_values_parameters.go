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

// NewListProjectNutanixCategoryValuesParams creates a new ListProjectNutanixCategoryValuesParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListProjectNutanixCategoryValuesParams() *ListProjectNutanixCategoryValuesParams {
	return &ListProjectNutanixCategoryValuesParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListProjectNutanixCategoryValuesParamsWithTimeout creates a new ListProjectNutanixCategoryValuesParams object
// with the ability to set a timeout on a request.
func NewListProjectNutanixCategoryValuesParamsWithTimeout(timeout time.Duration) *ListProjectNutanixCategoryValuesParams {
	return &ListProjectNutanixCategoryValuesParams{
		timeout: timeout,
	}
}

// NewListProjectNutanixCategoryValuesParamsWithContext creates a new ListProjectNutanixCategoryValuesParams object
// with the ability to set a context for a request.
func NewListProjectNutanixCategoryValuesParamsWithContext(ctx context.Context) *ListProjectNutanixCategoryValuesParams {
	return &ListProjectNutanixCategoryValuesParams{
		Context: ctx,
	}
}

// NewListProjectNutanixCategoryValuesParamsWithHTTPClient creates a new ListProjectNutanixCategoryValuesParams object
// with the ability to set a custom HTTPClient for a request.
func NewListProjectNutanixCategoryValuesParamsWithHTTPClient(client *http.Client) *ListProjectNutanixCategoryValuesParams {
	return &ListProjectNutanixCategoryValuesParams{
		HTTPClient: client,
	}
}

/*
ListProjectNutanixCategoryValuesParams contains all the parameters to send to the API endpoint

	for the list project nutanix category values operation.

	Typically these are written to a http.Request.
*/
type ListProjectNutanixCategoryValuesParams struct {

	// Credential.
	Credential *string

	// NutanixPassword.
	NutanixPassword *string

	// NutanixProxyURL.
	NutanixProxyURL *string

	// NutanixUsername.
	NutanixUsername *string

	/* Category.

	   Category to query the available values for
	*/
	Category string

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

// WithDefaults hydrates default values in the list project nutanix category values params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectNutanixCategoryValuesParams) WithDefaults() *ListProjectNutanixCategoryValuesParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list project nutanix category values params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectNutanixCategoryValuesParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithTimeout(timeout time.Duration) *ListProjectNutanixCategoryValuesParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithContext(ctx context.Context) *ListProjectNutanixCategoryValuesParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithHTTPClient(client *http.Client) *ListProjectNutanixCategoryValuesParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithCredential adds the credential to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithCredential(credential *string) *ListProjectNutanixCategoryValuesParams {
	o.SetCredential(credential)
	return o
}

// SetCredential adds the credential to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetCredential(credential *string) {
	o.Credential = credential
}

// WithNutanixPassword adds the nutanixPassword to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithNutanixPassword(nutanixPassword *string) *ListProjectNutanixCategoryValuesParams {
	o.SetNutanixPassword(nutanixPassword)
	return o
}

// SetNutanixPassword adds the nutanixPassword to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetNutanixPassword(nutanixPassword *string) {
	o.NutanixPassword = nutanixPassword
}

// WithNutanixProxyURL adds the nutanixProxyURL to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithNutanixProxyURL(nutanixProxyURL *string) *ListProjectNutanixCategoryValuesParams {
	o.SetNutanixProxyURL(nutanixProxyURL)
	return o
}

// SetNutanixProxyURL adds the nutanixProxyUrl to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetNutanixProxyURL(nutanixProxyURL *string) {
	o.NutanixProxyURL = nutanixProxyURL
}

// WithNutanixUsername adds the nutanixUsername to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithNutanixUsername(nutanixUsername *string) *ListProjectNutanixCategoryValuesParams {
	o.SetNutanixUsername(nutanixUsername)
	return o
}

// SetNutanixUsername adds the nutanixUsername to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetNutanixUsername(nutanixUsername *string) {
	o.NutanixUsername = nutanixUsername
}

// WithCategory adds the category to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithCategory(category string) *ListProjectNutanixCategoryValuesParams {
	o.SetCategory(category)
	return o
}

// SetCategory adds the category to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetCategory(category string) {
	o.Category = category
}

// WithDC adds the dc to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithDC(dc string) *ListProjectNutanixCategoryValuesParams {
	o.SetDC(dc)
	return o
}

// SetDC adds the dc to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetDC(dc string) {
	o.DC = dc
}

// WithProjectID adds the projectID to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) WithProjectID(projectID string) *ListProjectNutanixCategoryValuesParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the list project nutanix category values params
func (o *ListProjectNutanixCategoryValuesParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *ListProjectNutanixCategoryValuesParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

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

	if o.NutanixPassword != nil {

		// header param NutanixPassword
		if err := r.SetHeaderParam("NutanixPassword", *o.NutanixPassword); err != nil {
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

	// path param category
	if err := r.SetPathParam("category", o.Category); err != nil {
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
