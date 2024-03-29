// Code generated by go-swagger; DO NOT EDIT.

package azure

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

// NewListProjectAzureSubnetsParams creates a new ListProjectAzureSubnetsParams object,
// with the default timeout for this client.
//
// Default values are not hydrated, since defaults are normally applied by the API server side.
//
// To enforce default values in parameter, use SetDefaults or WithDefaults.
func NewListProjectAzureSubnetsParams() *ListProjectAzureSubnetsParams {
	return &ListProjectAzureSubnetsParams{
		timeout: cr.DefaultTimeout,
	}
}

// NewListProjectAzureSubnetsParamsWithTimeout creates a new ListProjectAzureSubnetsParams object
// with the ability to set a timeout on a request.
func NewListProjectAzureSubnetsParamsWithTimeout(timeout time.Duration) *ListProjectAzureSubnetsParams {
	return &ListProjectAzureSubnetsParams{
		timeout: timeout,
	}
}

// NewListProjectAzureSubnetsParamsWithContext creates a new ListProjectAzureSubnetsParams object
// with the ability to set a context for a request.
func NewListProjectAzureSubnetsParamsWithContext(ctx context.Context) *ListProjectAzureSubnetsParams {
	return &ListProjectAzureSubnetsParams{
		Context: ctx,
	}
}

// NewListProjectAzureSubnetsParamsWithHTTPClient creates a new ListProjectAzureSubnetsParams object
// with the ability to set a custom HTTPClient for a request.
func NewListProjectAzureSubnetsParamsWithHTTPClient(client *http.Client) *ListProjectAzureSubnetsParams {
	return &ListProjectAzureSubnetsParams{
		HTTPClient: client,
	}
}

/*
ListProjectAzureSubnetsParams contains all the parameters to send to the API endpoint

	for the list project azure subnets operation.

	Typically these are written to a http.Request.
*/
type ListProjectAzureSubnetsParams struct {

	// ClientID.
	ClientID *string

	// ClientSecret.
	ClientSecret *string

	// Credential.
	Credential *string

	// ResourceGroup.
	ResourceGroup *string

	// SubscriptionID.
	SubscriptionID *string

	// TenantID.
	TenantID *string

	// VirtualNetwork.
	VirtualNetwork *string

	// ProjectID.
	ProjectID string

	timeout    time.Duration
	Context    context.Context
	HTTPClient *http.Client
}

// WithDefaults hydrates default values in the list project azure subnets params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectAzureSubnetsParams) WithDefaults() *ListProjectAzureSubnetsParams {
	o.SetDefaults()
	return o
}

// SetDefaults hydrates default values in the list project azure subnets params (not the query body).
//
// All values with no default are reset to their zero value.
func (o *ListProjectAzureSubnetsParams) SetDefaults() {
	// no default values defined for this parameter
}

// WithTimeout adds the timeout to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithTimeout(timeout time.Duration) *ListProjectAzureSubnetsParams {
	o.SetTimeout(timeout)
	return o
}

// SetTimeout adds the timeout to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetTimeout(timeout time.Duration) {
	o.timeout = timeout
}

// WithContext adds the context to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithContext(ctx context.Context) *ListProjectAzureSubnetsParams {
	o.SetContext(ctx)
	return o
}

// SetContext adds the context to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetContext(ctx context.Context) {
	o.Context = ctx
}

// WithHTTPClient adds the HTTPClient to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithHTTPClient(client *http.Client) *ListProjectAzureSubnetsParams {
	o.SetHTTPClient(client)
	return o
}

// SetHTTPClient adds the HTTPClient to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetHTTPClient(client *http.Client) {
	o.HTTPClient = client
}

// WithClientID adds the clientID to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithClientID(clientID *string) *ListProjectAzureSubnetsParams {
	o.SetClientID(clientID)
	return o
}

// SetClientID adds the clientId to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetClientID(clientID *string) {
	o.ClientID = clientID
}

// WithClientSecret adds the clientSecret to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithClientSecret(clientSecret *string) *ListProjectAzureSubnetsParams {
	o.SetClientSecret(clientSecret)
	return o
}

// SetClientSecret adds the clientSecret to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetClientSecret(clientSecret *string) {
	o.ClientSecret = clientSecret
}

// WithCredential adds the credential to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithCredential(credential *string) *ListProjectAzureSubnetsParams {
	o.SetCredential(credential)
	return o
}

// SetCredential adds the credential to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetCredential(credential *string) {
	o.Credential = credential
}

// WithResourceGroup adds the resourceGroup to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithResourceGroup(resourceGroup *string) *ListProjectAzureSubnetsParams {
	o.SetResourceGroup(resourceGroup)
	return o
}

// SetResourceGroup adds the resourceGroup to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetResourceGroup(resourceGroup *string) {
	o.ResourceGroup = resourceGroup
}

// WithSubscriptionID adds the subscriptionID to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithSubscriptionID(subscriptionID *string) *ListProjectAzureSubnetsParams {
	o.SetSubscriptionID(subscriptionID)
	return o
}

// SetSubscriptionID adds the subscriptionId to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetSubscriptionID(subscriptionID *string) {
	o.SubscriptionID = subscriptionID
}

// WithTenantID adds the tenantID to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithTenantID(tenantID *string) *ListProjectAzureSubnetsParams {
	o.SetTenantID(tenantID)
	return o
}

// SetTenantID adds the tenantId to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetTenantID(tenantID *string) {
	o.TenantID = tenantID
}

// WithVirtualNetwork adds the virtualNetwork to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithVirtualNetwork(virtualNetwork *string) *ListProjectAzureSubnetsParams {
	o.SetVirtualNetwork(virtualNetwork)
	return o
}

// SetVirtualNetwork adds the virtualNetwork to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetVirtualNetwork(virtualNetwork *string) {
	o.VirtualNetwork = virtualNetwork
}

// WithProjectID adds the projectID to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) WithProjectID(projectID string) *ListProjectAzureSubnetsParams {
	o.SetProjectID(projectID)
	return o
}

// SetProjectID adds the projectId to the list project azure subnets params
func (o *ListProjectAzureSubnetsParams) SetProjectID(projectID string) {
	o.ProjectID = projectID
}

// WriteToRequest writes these params to a swagger request
func (o *ListProjectAzureSubnetsParams) WriteToRequest(r runtime.ClientRequest, reg strfmt.Registry) error {

	if err := r.SetTimeout(o.timeout); err != nil {
		return err
	}
	var res []error

	if o.ClientID != nil {

		// header param ClientID
		if err := r.SetHeaderParam("ClientID", *o.ClientID); err != nil {
			return err
		}
	}

	if o.ClientSecret != nil {

		// header param ClientSecret
		if err := r.SetHeaderParam("ClientSecret", *o.ClientSecret); err != nil {
			return err
		}
	}

	if o.Credential != nil {

		// header param Credential
		if err := r.SetHeaderParam("Credential", *o.Credential); err != nil {
			return err
		}
	}

	if o.ResourceGroup != nil {

		// header param ResourceGroup
		if err := r.SetHeaderParam("ResourceGroup", *o.ResourceGroup); err != nil {
			return err
		}
	}

	if o.SubscriptionID != nil {

		// header param SubscriptionID
		if err := r.SetHeaderParam("SubscriptionID", *o.SubscriptionID); err != nil {
			return err
		}
	}

	if o.TenantID != nil {

		// header param TenantID
		if err := r.SetHeaderParam("TenantID", *o.TenantID); err != nil {
			return err
		}
	}

	if o.VirtualNetwork != nil {

		// header param VirtualNetwork
		if err := r.SetHeaderParam("VirtualNetwork", *o.VirtualNetwork); err != nil {
			return err
		}
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
