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

// ListProjectEKSClusterRolesReader is a Reader for the ListProjectEKSClusterRoles structure.
type ListProjectEKSClusterRolesReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListProjectEKSClusterRolesReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListProjectEKSClusterRolesOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewListProjectEKSClusterRolesUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 403:
		result := NewListProjectEKSClusterRolesForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewListProjectEKSClusterRolesDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListProjectEKSClusterRolesOK creates a ListProjectEKSClusterRolesOK with default headers values
func NewListProjectEKSClusterRolesOK() *ListProjectEKSClusterRolesOK {
	return &ListProjectEKSClusterRolesOK{}
}

/*
ListProjectEKSClusterRolesOK describes a response with status code 200, with default header values.

EKSClusterRoleList
*/
type ListProjectEKSClusterRolesOK struct {
	Payload models.EKSClusterRoleList
}

// IsSuccess returns true when this list project e k s cluster roles o k response has a 2xx status code
func (o *ListProjectEKSClusterRolesOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list project e k s cluster roles o k response has a 3xx status code
func (o *ListProjectEKSClusterRolesOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s cluster roles o k response has a 4xx status code
func (o *ListProjectEKSClusterRolesOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list project e k s cluster roles o k response has a 5xx status code
func (o *ListProjectEKSClusterRolesOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s cluster roles o k response a status code equal to that given
func (o *ListProjectEKSClusterRolesOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListProjectEKSClusterRolesOK) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRolesOK  %+v", 200, o.Payload)
}

func (o *ListProjectEKSClusterRolesOK) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRolesOK  %+v", 200, o.Payload)
}

func (o *ListProjectEKSClusterRolesOK) GetPayload() models.EKSClusterRoleList {
	return o.Payload
}

func (o *ListProjectEKSClusterRolesOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListProjectEKSClusterRolesUnauthorized creates a ListProjectEKSClusterRolesUnauthorized with default headers values
func NewListProjectEKSClusterRolesUnauthorized() *ListProjectEKSClusterRolesUnauthorized {
	return &ListProjectEKSClusterRolesUnauthorized{}
}

/*
ListProjectEKSClusterRolesUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type ListProjectEKSClusterRolesUnauthorized struct {
}

// IsSuccess returns true when this list project e k s cluster roles unauthorized response has a 2xx status code
func (o *ListProjectEKSClusterRolesUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list project e k s cluster roles unauthorized response has a 3xx status code
func (o *ListProjectEKSClusterRolesUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s cluster roles unauthorized response has a 4xx status code
func (o *ListProjectEKSClusterRolesUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this list project e k s cluster roles unauthorized response has a 5xx status code
func (o *ListProjectEKSClusterRolesUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s cluster roles unauthorized response a status code equal to that given
func (o *ListProjectEKSClusterRolesUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *ListProjectEKSClusterRolesUnauthorized) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRolesUnauthorized ", 401)
}

func (o *ListProjectEKSClusterRolesUnauthorized) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRolesUnauthorized ", 401)
}

func (o *ListProjectEKSClusterRolesUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListProjectEKSClusterRolesForbidden creates a ListProjectEKSClusterRolesForbidden with default headers values
func NewListProjectEKSClusterRolesForbidden() *ListProjectEKSClusterRolesForbidden {
	return &ListProjectEKSClusterRolesForbidden{}
}

/*
ListProjectEKSClusterRolesForbidden describes a response with status code 403, with default header values.

EmptyResponse is a empty response
*/
type ListProjectEKSClusterRolesForbidden struct {
}

// IsSuccess returns true when this list project e k s cluster roles forbidden response has a 2xx status code
func (o *ListProjectEKSClusterRolesForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list project e k s cluster roles forbidden response has a 3xx status code
func (o *ListProjectEKSClusterRolesForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list project e k s cluster roles forbidden response has a 4xx status code
func (o *ListProjectEKSClusterRolesForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this list project e k s cluster roles forbidden response has a 5xx status code
func (o *ListProjectEKSClusterRolesForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this list project e k s cluster roles forbidden response a status code equal to that given
func (o *ListProjectEKSClusterRolesForbidden) IsCode(code int) bool {
	return code == 403
}

func (o *ListProjectEKSClusterRolesForbidden) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRolesForbidden ", 403)
}

func (o *ListProjectEKSClusterRolesForbidden) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRolesForbidden ", 403)
}

func (o *ListProjectEKSClusterRolesForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListProjectEKSClusterRolesDefault creates a ListProjectEKSClusterRolesDefault with default headers values
func NewListProjectEKSClusterRolesDefault(code int) *ListProjectEKSClusterRolesDefault {
	return &ListProjectEKSClusterRolesDefault{
		_statusCode: code,
	}
}

/*
ListProjectEKSClusterRolesDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListProjectEKSClusterRolesDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list project e k s cluster roles default response
func (o *ListProjectEKSClusterRolesDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list project e k s cluster roles default response has a 2xx status code
func (o *ListProjectEKSClusterRolesDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list project e k s cluster roles default response has a 3xx status code
func (o *ListProjectEKSClusterRolesDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list project e k s cluster roles default response has a 4xx status code
func (o *ListProjectEKSClusterRolesDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list project e k s cluster roles default response has a 5xx status code
func (o *ListProjectEKSClusterRolesDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list project e k s cluster roles default response a status code equal to that given
func (o *ListProjectEKSClusterRolesDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListProjectEKSClusterRolesDefault) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRoles default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectEKSClusterRolesDefault) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/providers/eks/clusterroles][%d] listProjectEKSClusterRoles default  %+v", o._statusCode, o.Payload)
}

func (o *ListProjectEKSClusterRolesDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListProjectEKSClusterRolesDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
