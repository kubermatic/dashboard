// Code generated by go-swagger; DO NOT EDIT.

package nutanix

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"fmt"
	"io"

	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/models"
)

// ListProjectNutanixCategoryValuesReader is a Reader for the ListProjectNutanixCategoryValues structure.
type ListProjectNutanixCategoryValuesReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListProjectNutanixCategoryValuesReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListProjectNutanixCategoryValuesOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	default:
		result := NewListProjectNutanixCategoryValuesDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListProjectNutanixCategoryValuesOK creates a ListProjectNutanixCategoryValuesOK with default headers values
func NewListProjectNutanixCategoryValuesOK() *ListProjectNutanixCategoryValuesOK {
	return &ListProjectNutanixCategoryValuesOK{}
}

/*
ListProjectNutanixCategoryValuesOK describes a response with status code 200, with default header values.

NutanixCategoryValueList
*/
type ListProjectNutanixCategoryValuesOK struct {
	Payload models.NutanixCategoryValueList
}

// IsSuccess returns true when this list project nutanix category values o k response has a 2xx status code
func (o *ListProjectNutanixCategoryValuesOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list project nutanix category values o k response has a 3xx status code
func (o *ListProjectNutanixCategoryValuesOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project nutanix category values o k response has a 4xx status code
func (o *ListProjectNutanixCategoryValuesOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list project nutanix category values o k response has a 5xx status code
func (o *ListProjectNutanixCategoryValuesOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list project nutanix category values o k response a status code equal to that given
func (o *ListProjectNutanixCategoryValuesOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListProjectNutanixCategoryValuesOK) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/nutanix/{dc}/categories/{category}/values][%d] listProjectNutanixCategoryValuesOK  %+v", 200, o.Payload)
}

func (o *ListProjectNutanixCategoryValuesOK) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/nutanix/{dc}/categories/{category}/values][%d] listProjectNutanixCategoryValuesOK  %+v", 200, o.Payload)
}

func (o *ListProjectNutanixCategoryValuesOK) GetPayload() models.NutanixCategoryValueList {
	return o.Payload
}

func (o *ListProjectNutanixCategoryValuesOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListProjectNutanixCategoryValuesDefault creates a ListProjectNutanixCategoryValuesDefault with default headers values
func NewListProjectNutanixCategoryValuesDefault(code int) *ListProjectNutanixCategoryValuesDefault {
	return &ListProjectNutanixCategoryValuesDefault{
		_statusCode: code,
	}
}

/*
ListProjectNutanixCategoryValuesDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListProjectNutanixCategoryValuesDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list project nutanix category values default response
func (o *ListProjectNutanixCategoryValuesDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list project nutanix category values default response has a 2xx status code
func (o *ListProjectNutanixCategoryValuesDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list project nutanix category values default response has a 3xx status code
func (o *ListProjectNutanixCategoryValuesDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list project nutanix category values default response has a 4xx status code
func (o *ListProjectNutanixCategoryValuesDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list project nutanix category values default response has a 5xx status code
func (o *ListProjectNutanixCategoryValuesDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list project nutanix category values default response a status code equal to that given
func (o *ListProjectNutanixCategoryValuesDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListProjectNutanixCategoryValuesDefault) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/nutanix/{dc}/categories/{category}/values][%d] listProjectNutanixCategoryValues default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectNutanixCategoryValuesDefault) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/nutanix/{dc}/categories/{category}/values][%d] listProjectNutanixCategoryValues default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectNutanixCategoryValuesDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListProjectNutanixCategoryValuesDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
