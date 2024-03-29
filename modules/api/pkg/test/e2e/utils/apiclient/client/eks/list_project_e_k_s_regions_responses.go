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

// ListProjectEKSRegionsReader is a Reader for the ListProjectEKSRegions structure.
type ListProjectEKSRegionsReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListProjectEKSRegionsReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListProjectEKSRegionsOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewListProjectEKSRegionsUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 403:
		result := NewListProjectEKSRegionsForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewListProjectEKSRegionsDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListProjectEKSRegionsOK creates a ListProjectEKSRegionsOK with default headers values
func NewListProjectEKSRegionsOK() *ListProjectEKSRegionsOK {
	return &ListProjectEKSRegionsOK{}
}

/*
ListProjectEKSRegionsOK describes a response with status code 200, with default header values.

EKSRegionList
*/
type ListProjectEKSRegionsOK struct {
	Payload []models.EKSRegionList
}

// IsSuccess returns true when this list project e k s regions o k response has a 2xx status code
func (o *ListProjectEKSRegionsOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list project e k s regions o k response has a 3xx status code
func (o *ListProjectEKSRegionsOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s regions o k response has a 4xx status code
func (o *ListProjectEKSRegionsOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list project e k s regions o k response has a 5xx status code
func (o *ListProjectEKSRegionsOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s regions o k response a status code equal to that given
func (o *ListProjectEKSRegionsOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListProjectEKSRegionsOK) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegionsOK  %+v", 200, o.Payload)
}

func (o *ListProjectEKSRegionsOK) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegionsOK  %+v", 200, o.Payload)
}

func (o *ListProjectEKSRegionsOK) GetPayload() []models.EKSRegionList {
	return o.Payload
}

func (o *ListProjectEKSRegionsOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListProjectEKSRegionsUnauthorized creates a ListProjectEKSRegionsUnauthorized with default headers values
func NewListProjectEKSRegionsUnauthorized() *ListProjectEKSRegionsUnauthorized {
	return &ListProjectEKSRegionsUnauthorized{}
}

/*
ListProjectEKSRegionsUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type ListProjectEKSRegionsUnauthorized struct {
}

// IsSuccess returns true when this list project e k s regions unauthorized response has a 2xx status code
func (o *ListProjectEKSRegionsUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list project e k s regions unauthorized response has a 3xx status code
func (o *ListProjectEKSRegionsUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s regions unauthorized response has a 4xx status code
func (o *ListProjectEKSRegionsUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this list project e k s regions unauthorized response has a 5xx status code
func (o *ListProjectEKSRegionsUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s regions unauthorized response a status code equal to that given
func (o *ListProjectEKSRegionsUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *ListProjectEKSRegionsUnauthorized) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegionsUnauthorized ", 401)
}

func (o *ListProjectEKSRegionsUnauthorized) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegionsUnauthorized ", 401)
}

func (o *ListProjectEKSRegionsUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListProjectEKSRegionsForbidden creates a ListProjectEKSRegionsForbidden with default headers values
func NewListProjectEKSRegionsForbidden() *ListProjectEKSRegionsForbidden {
	return &ListProjectEKSRegionsForbidden{}
}

/*
ListProjectEKSRegionsForbidden describes a response with status code 403, with default header values.

EmptyResponse is a empty response
*/
type ListProjectEKSRegionsForbidden struct {
}

// IsSuccess returns true when this list project e k s regions forbidden response has a 2xx status code
func (o *ListProjectEKSRegionsForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list project e k s regions forbidden response has a 3xx status code
func (o *ListProjectEKSRegionsForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s regions forbidden response has a 4xx status code
func (o *ListProjectEKSRegionsForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this list project e k s regions forbidden response has a 5xx status code
func (o *ListProjectEKSRegionsForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s regions forbidden response a status code equal to that given
func (o *ListProjectEKSRegionsForbidden) IsCode(code int) bool {
	return code == 403
}

func (o *ListProjectEKSRegionsForbidden) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegionsForbidden ", 403)
}

func (o *ListProjectEKSRegionsForbidden) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegionsForbidden ", 403)
}

func (o *ListProjectEKSRegionsForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListProjectEKSRegionsDefault creates a ListProjectEKSRegionsDefault with default headers values
func NewListProjectEKSRegionsDefault(code int) *ListProjectEKSRegionsDefault {
	return &ListProjectEKSRegionsDefault{
		_statusCode: code,
	}
}

/*
ListProjectEKSRegionsDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListProjectEKSRegionsDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list project e k s regions default response
func (o *ListProjectEKSRegionsDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list project e k s regions default response has a 2xx status code
func (o *ListProjectEKSRegionsDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list project e k s regions default response has a 3xx status code
func (o *ListProjectEKSRegionsDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list project e k s regions default response has a 4xx status code
func (o *ListProjectEKSRegionsDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list project e k s regions default response has a 5xx status code
func (o *ListProjectEKSRegionsDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list project e k s regions default response a status code equal to that given
func (o *ListProjectEKSRegionsDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListProjectEKSRegionsDefault) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegions default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectEKSRegionsDefault) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/regions][%d] listProjectEKSRegions default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectEKSRegionsDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListProjectEKSRegionsDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
