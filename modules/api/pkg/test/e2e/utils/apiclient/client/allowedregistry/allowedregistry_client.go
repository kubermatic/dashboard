// Code generated by go-swagger; DO NOT EDIT.

package allowedregistry

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"
)

// New creates a new allowedregistry API client.
func New(transport runtime.ClientTransport, formats strfmt.Registry) ClientService {
	return &Client{transport: transport, formats: formats}
}

/*
Client for allowedregistry API
*/
type Client struct {
	transport runtime.ClientTransport
	formats   strfmt.Registry
}

// ClientOption is the option for Client methods
type ClientOption func(*runtime.ClientOperation)

// ClientService is the interface for Client methods
type ClientService interface {
	CreateAllowedRegistry(params *CreateAllowedRegistryParams, authInfo runtime.ClientAuthInfoWriter, opts ...ClientOption) (*CreateAllowedRegistryCreated, error)

	ListAllowedRegistries(params *ListAllowedRegistriesParams, authInfo runtime.ClientAuthInfoWriter, opts ...ClientOption) (*ListAllowedRegistriesOK, error)

	SetTransport(transport runtime.ClientTransport)
}

/*
CreateAllowedRegistry Creates a allowed registry
*/
func (a *Client) CreateAllowedRegistry(params *CreateAllowedRegistryParams, authInfo runtime.ClientAuthInfoWriter, opts ...ClientOption) (*CreateAllowedRegistryCreated, error) {
	// TODO: Validate the params before sending
	if params == nil {
		params = NewCreateAllowedRegistryParams()
	}
	op := &runtime.ClientOperation{
		ID:                 "createAllowedRegistry",
		Method:             "POST",
		PathPattern:        "/api/v2/allowedregistries",
		ProducesMediaTypes: []string{"application/json"},
		ConsumesMediaTypes: []string{"application/json"},
		Schemes:            []string{"https"},
		Params:             params,
		Reader:             &CreateAllowedRegistryReader{formats: a.formats},
		AuthInfo:           authInfo,
		Context:            params.Context,
		Client:             params.HTTPClient,
	}
	for _, opt := range opts {
		opt(op)
	}

	result, err := a.transport.Submit(op)
	if err != nil {
		return nil, err
	}
	success, ok := result.(*CreateAllowedRegistryCreated)
	if ok {
		return success, nil
	}
	// unexpected success response
	unexpectedSuccess := result.(*CreateAllowedRegistryDefault)
	return nil, runtime.NewAPIError("unexpected success response: content available as default response in error", unexpectedSuccess, unexpectedSuccess.Code())
}

/*
ListAllowedRegistries lists allowed registries
*/
func (a *Client) ListAllowedRegistries(params *ListAllowedRegistriesParams, authInfo runtime.ClientAuthInfoWriter, opts ...ClientOption) (*ListAllowedRegistriesOK, error) {
	// TODO: Validate the params before sending
	if params == nil {
		params = NewListAllowedRegistriesParams()
	}
	op := &runtime.ClientOperation{
		ID:                 "listAllowedRegistries",
		Method:             "GET",
		PathPattern:        "/api/v2/allowedregistries",
		ProducesMediaTypes: []string{"application/json"},
		ConsumesMediaTypes: []string{"application/json"},
		Schemes:            []string{"https"},
		Params:             params,
		Reader:             &ListAllowedRegistriesReader{formats: a.formats},
		AuthInfo:           authInfo,
		Context:            params.Context,
		Client:             params.HTTPClient,
	}
	for _, opt := range opts {
		opt(op)
	}

	result, err := a.transport.Submit(op)
	if err != nil {
		return nil, err
	}
	success, ok := result.(*ListAllowedRegistriesOK)
	if ok {
		return success, nil
	}
	// unexpected success response
	unexpectedSuccess := result.(*ListAllowedRegistriesDefault)
	return nil, runtime.NewAPIError("unexpected success response: content available as default response in error", unexpectedSuccess, unexpectedSuccess.Code())
}

// SetTransport changes the transport on the client
func (a *Client) SetTransport(transport runtime.ClientTransport) {
	a.transport = transport
}
