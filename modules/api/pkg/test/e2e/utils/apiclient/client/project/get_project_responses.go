// Code generated by go-swagger; DO NOT EDIT.

package project

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"fmt"
	"io"

	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/models"
)

// GetProjectReader is a Reader for the GetProject structure.
type GetProjectReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *GetProjectReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewGetProjectOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewGetProjectUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 409:
		result := NewGetProjectConflict()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewGetProjectDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewGetProjectOK creates a GetProjectOK with default headers values
func NewGetProjectOK() *GetProjectOK {
	return &GetProjectOK{}
}

/*
GetProjectOK describes a response with status code 200, with default header values.

Project
*/
type GetProjectOK struct {
	Payload *models.Project
}

// IsSuccess returns true when this get project o k response has a 2xx status code
func (o *GetProjectOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this get project o k response has a 3xx status code
func (o *GetProjectOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this get project o k response has a 4xx status code
func (o *GetProjectOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this get project o k response has a 5xx status code
func (o *GetProjectOK) IsServerError() bool {
	return false
}

// IsCode returns true when this get project o k response a status code equal to that given
func (o *GetProjectOK) IsCode(code int) bool {
	return code == 200
}

func (o *GetProjectOK) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProjectOK  %+v", 200, o.Payload)
}

func (o *GetProjectOK) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProjectOK  %+v", 200, o.Payload)
}

func (o *GetProjectOK) GetPayload() *models.Project {
	return o.Payload
}

func (o *GetProjectOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.Project)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewGetProjectUnauthorized creates a GetProjectUnauthorized with default headers values
func NewGetProjectUnauthorized() *GetProjectUnauthorized {
	return &GetProjectUnauthorized{}
}

/*
GetProjectUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type GetProjectUnauthorized struct {
}

// IsSuccess returns true when this get project unauthorized response has a 2xx status code
func (o *GetProjectUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this get project unauthorized response has a 3xx status code
func (o *GetProjectUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this get project unauthorized response has a 4xx status code
func (o *GetProjectUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this get project unauthorized response has a 5xx status code
func (o *GetProjectUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this get project unauthorized response a status code equal to that given
func (o *GetProjectUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *GetProjectUnauthorized) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProjectUnauthorized ", 401)
}

func (o *GetProjectUnauthorized) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProjectUnauthorized ", 401)
}

func (o *GetProjectUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewGetProjectConflict creates a GetProjectConflict with default headers values
func NewGetProjectConflict() *GetProjectConflict {
	return &GetProjectConflict{}
}

/*
GetProjectConflict describes a response with status code 409, with default header values.

EmptyResponse is a empty response
*/
type GetProjectConflict struct {
}

// IsSuccess returns true when this get project conflict response has a 2xx status code
func (o *GetProjectConflict) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this get project conflict response has a 3xx status code
func (o *GetProjectConflict) IsRedirect() bool {
	return false
}

// IsClientError returns true when this get project conflict response has a 4xx status code
func (o *GetProjectConflict) IsClientError() bool {
	return true
}

// IsServerError returns true when this get project conflict response has a 5xx status code
func (o *GetProjectConflict) IsServerError() bool {
	return false
}

// IsCode returns true when this get project conflict response a status code equal to that given
func (o *GetProjectConflict) IsCode(code int) bool {
	return code == 409
}

func (o *GetProjectConflict) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProjectConflict ", 409)
}

func (o *GetProjectConflict) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProjectConflict ", 409)
}

func (o *GetProjectConflict) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewGetProjectDefault creates a GetProjectDefault with default headers values
func NewGetProjectDefault(code int) *GetProjectDefault {
	return &GetProjectDefault{
		_statusCode: code,
	}
}

/*
GetProjectDefault describes a response with status code -1, with default header values.

errorResponse
*/
type GetProjectDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the get project default response
func (o *GetProjectDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this get project default response has a 2xx status code
func (o *GetProjectDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this get project default response has a 3xx status code
func (o *GetProjectDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this get project default response has a 4xx status code
func (o *GetProjectDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this get project default response has a 5xx status code
func (o *GetProjectDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this get project default response a status code equal to that given
func (o *GetProjectDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *GetProjectDefault) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProject default  %+v", o._statusCode, o.Payload)
}

func (o *GetProjectDefault) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}][%d] getProject default  %+v", o._statusCode, o.Payload)
}

func (o *GetProjectDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *GetProjectDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}