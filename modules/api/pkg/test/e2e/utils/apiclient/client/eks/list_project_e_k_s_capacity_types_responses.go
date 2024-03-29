// Code generated by go-swagger; DO NOT EDIT.

package eks

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"fmt"
	"io"

	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/models"
)

// ListProjectEKSCapacityTypesReader is a Reader for the ListProjectEKSCapacityTypes structure.
type ListProjectEKSCapacityTypesReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListProjectEKSCapacityTypesReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListProjectEKSCapacityTypesOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewListProjectEKSCapacityTypesUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 403:
		result := NewListProjectEKSCapacityTypesForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewListProjectEKSCapacityTypesDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListProjectEKSCapacityTypesOK creates a ListProjectEKSCapacityTypesOK with default headers values
func NewListProjectEKSCapacityTypesOK() *ListProjectEKSCapacityTypesOK {
	return &ListProjectEKSCapacityTypesOK{}
}

/*
ListProjectEKSCapacityTypesOK describes a response with status code 200, with default header values.

EKSCapacityTypeList
*/
type ListProjectEKSCapacityTypesOK struct {
	Payload models.EKSCapacityTypeList
}

// IsSuccess returns true when this list project e k s capacity types o k response has a 2xx status code
func (o *ListProjectEKSCapacityTypesOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list project e k s capacity types o k response has a 3xx status code
func (o *ListProjectEKSCapacityTypesOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s capacity types o k response has a 4xx status code
func (o *ListProjectEKSCapacityTypesOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list project e k s capacity types o k response has a 5xx status code
func (o *ListProjectEKSCapacityTypesOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s capacity types o k response a status code equal to that given
func (o *ListProjectEKSCapacityTypesOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListProjectEKSCapacityTypesOK) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypesOK  %+v", 200, o.Payload)
}

func (o *ListProjectEKSCapacityTypesOK) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypesOK  %+v", 200, o.Payload)
}

func (o *ListProjectEKSCapacityTypesOK) GetPayload() models.EKSCapacityTypeList {
	return o.Payload
}

func (o *ListProjectEKSCapacityTypesOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListProjectEKSCapacityTypesUnauthorized creates a ListProjectEKSCapacityTypesUnauthorized with default headers values
func NewListProjectEKSCapacityTypesUnauthorized() *ListProjectEKSCapacityTypesUnauthorized {
	return &ListProjectEKSCapacityTypesUnauthorized{}
}

/*
ListProjectEKSCapacityTypesUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type ListProjectEKSCapacityTypesUnauthorized struct {
}

// IsSuccess returns true when this list project e k s capacity types unauthorized response has a 2xx status code
func (o *ListProjectEKSCapacityTypesUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list project e k s capacity types unauthorized response has a 3xx status code
func (o *ListProjectEKSCapacityTypesUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s capacity types unauthorized response has a 4xx status code
func (o *ListProjectEKSCapacityTypesUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this list project e k s capacity types unauthorized response has a 5xx status code
func (o *ListProjectEKSCapacityTypesUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s capacity types unauthorized response a status code equal to that given
func (o *ListProjectEKSCapacityTypesUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *ListProjectEKSCapacityTypesUnauthorized) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypesUnauthorized ", 401)
}

func (o *ListProjectEKSCapacityTypesUnauthorized) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypesUnauthorized ", 401)
}

func (o *ListProjectEKSCapacityTypesUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListProjectEKSCapacityTypesForbidden creates a ListProjectEKSCapacityTypesForbidden with default headers values
func NewListProjectEKSCapacityTypesForbidden() *ListProjectEKSCapacityTypesForbidden {
	return &ListProjectEKSCapacityTypesForbidden{}
}

/*
ListProjectEKSCapacityTypesForbidden describes a response with status code 403, with default header values.

EmptyResponse is a empty response
*/
type ListProjectEKSCapacityTypesForbidden struct {
}

// IsSuccess returns true when this list project e k s capacity types forbidden response has a 2xx status code
func (o *ListProjectEKSCapacityTypesForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list project e k s capacity types forbidden response has a 3xx status code
func (o *ListProjectEKSCapacityTypesForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s capacity types forbidden response has a 4xx status code
func (o *ListProjectEKSCapacityTypesForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this list project e k s capacity types forbidden response has a 5xx status code
func (o *ListProjectEKSCapacityTypesForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s capacity types forbidden response a status code equal to that given
func (o *ListProjectEKSCapacityTypesForbidden) IsCode(code int) bool {
	return code == 403
}

func (o *ListProjectEKSCapacityTypesForbidden) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypesForbidden ", 403)
}

func (o *ListProjectEKSCapacityTypesForbidden) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypesForbidden ", 403)
}

func (o *ListProjectEKSCapacityTypesForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListProjectEKSCapacityTypesDefault creates a ListProjectEKSCapacityTypesDefault with default headers values
func NewListProjectEKSCapacityTypesDefault(code int) *ListProjectEKSCapacityTypesDefault {
	return &ListProjectEKSCapacityTypesDefault{
		_statusCode: code,
	}
}

/*
ListProjectEKSCapacityTypesDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListProjectEKSCapacityTypesDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list project e k s capacity types default response
func (o *ListProjectEKSCapacityTypesDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list project e k s capacity types default response has a 2xx status code
func (o *ListProjectEKSCapacityTypesDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list project e k s capacity types default response has a 3xx status code
func (o *ListProjectEKSCapacityTypesDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list project e k s capacity types default response has a 4xx status code
func (o *ListProjectEKSCapacityTypesDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list project e k s capacity types default response has a 5xx status code
func (o *ListProjectEKSCapacityTypesDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list project e k s capacity types default response a status code equal to that given
func (o *ListProjectEKSCapacityTypesDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListProjectEKSCapacityTypesDefault) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypes default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectEKSCapacityTypesDefault) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/capacitytypes][%d] listProjectEKSCapacityTypes default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectEKSCapacityTypesDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListProjectEKSCapacityTypesDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
