// Code generated by go-swagger; DO NOT EDIT.

package vsphere

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"fmt"
	"io"

	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/models"
)

// ListProjectVSphereDatastoresReader is a Reader for the ListProjectVSphereDatastores structure.
type ListProjectVSphereDatastoresReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListProjectVSphereDatastoresReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListProjectVSphereDatastoresOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	default:
		result := NewListProjectVSphereDatastoresDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListProjectVSphereDatastoresOK creates a ListProjectVSphereDatastoresOK with default headers values
func NewListProjectVSphereDatastoresOK() *ListProjectVSphereDatastoresOK {
	return &ListProjectVSphereDatastoresOK{}
}

/*
ListProjectVSphereDatastoresOK describes a response with status code 200, with default header values.

VSphereDatastoreList
*/
type ListProjectVSphereDatastoresOK struct {
	Payload []*models.VSphereDatastoreList
}

// IsSuccess returns true when this list project v sphere datastores o k response has a 2xx status code
func (o *ListProjectVSphereDatastoresOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list project v sphere datastores o k response has a 3xx status code
func (o *ListProjectVSphereDatastoresOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project v sphere datastores o k response has a 4xx status code
func (o *ListProjectVSphereDatastoresOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list project v sphere datastores o k response has a 5xx status code
func (o *ListProjectVSphereDatastoresOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list project v sphere datastores o k response a status code equal to that given
func (o *ListProjectVSphereDatastoresOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListProjectVSphereDatastoresOK) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/vsphere/datastores][%d] listProjectVSphereDatastoresOK  %+v", 200, o.Payload)
}

func (o *ListProjectVSphereDatastoresOK) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/vsphere/datastores][%d] listProjectVSphereDatastoresOK  %+v", 200, o.Payload)
}

func (o *ListProjectVSphereDatastoresOK) GetPayload() []*models.VSphereDatastoreList {
	return o.Payload
}

func (o *ListProjectVSphereDatastoresOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListProjectVSphereDatastoresDefault creates a ListProjectVSphereDatastoresDefault with default headers values
func NewListProjectVSphereDatastoresDefault(code int) *ListProjectVSphereDatastoresDefault {
	return &ListProjectVSphereDatastoresDefault{
		_statusCode: code,
	}
}

/*
ListProjectVSphereDatastoresDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListProjectVSphereDatastoresDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list project v sphere datastores default response
func (o *ListProjectVSphereDatastoresDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list project v sphere datastores default response has a 2xx status code
func (o *ListProjectVSphereDatastoresDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list project v sphere datastores default response has a 3xx status code
func (o *ListProjectVSphereDatastoresDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list project v sphere datastores default response has a 4xx status code
func (o *ListProjectVSphereDatastoresDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list project v sphere datastores default response has a 5xx status code
func (o *ListProjectVSphereDatastoresDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list project v sphere datastores default response a status code equal to that given
func (o *ListProjectVSphereDatastoresDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListProjectVSphereDatastoresDefault) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/vsphere/datastores][%d] listProjectVSphereDatastores default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectVSphereDatastoresDefault) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/vsphere/datastores][%d] listProjectVSphereDatastores default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectVSphereDatastoresDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListProjectVSphereDatastoresDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
