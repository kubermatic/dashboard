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

// ListClusterBackupStorageLocationReader is a Reader for the ListClusterBackupStorageLocation structure.
type ListClusterBackupStorageLocationReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListClusterBackupStorageLocationReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListClusterBackupStorageLocationOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewListClusterBackupStorageLocationUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 403:
		result := NewListClusterBackupStorageLocationForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewListClusterBackupStorageLocationDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListClusterBackupStorageLocationOK creates a ListClusterBackupStorageLocationOK with default headers values
func NewListClusterBackupStorageLocationOK() *ListClusterBackupStorageLocationOK {
	return &ListClusterBackupStorageLocationOK{}
}

/*
ListClusterBackupStorageLocationOK describes a response with status code 200, with default header values.

ClusterBackupStorageLocation
*/
type ListClusterBackupStorageLocationOK struct {
	Payload []*models.ClusterBackupStorageLocation
}

// IsSuccess returns true when this list cluster backup storage location o k response has a 2xx status code
func (o *ListClusterBackupStorageLocationOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list cluster backup storage location o k response has a 3xx status code
func (o *ListClusterBackupStorageLocationOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list cluster backup storage location o k response has a 4xx status code
func (o *ListClusterBackupStorageLocationOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list cluster backup storage location o k response has a 5xx status code
func (o *ListClusterBackupStorageLocationOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list cluster backup storage location o k response a status code equal to that given
func (o *ListClusterBackupStorageLocationOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListClusterBackupStorageLocationOK) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocationOK  %+v", 200, o.Payload)
}

func (o *ListClusterBackupStorageLocationOK) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocationOK  %+v", 200, o.Payload)
}

func (o *ListClusterBackupStorageLocationOK) GetPayload() []*models.ClusterBackupStorageLocation {
	return o.Payload
}

func (o *ListClusterBackupStorageLocationOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListClusterBackupStorageLocationUnauthorized creates a ListClusterBackupStorageLocationUnauthorized with default headers values
func NewListClusterBackupStorageLocationUnauthorized() *ListClusterBackupStorageLocationUnauthorized {
	return &ListClusterBackupStorageLocationUnauthorized{}
}

/*
ListClusterBackupStorageLocationUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type ListClusterBackupStorageLocationUnauthorized struct {
}

// IsSuccess returns true when this list cluster backup storage location unauthorized response has a 2xx status code
func (o *ListClusterBackupStorageLocationUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list cluster backup storage location unauthorized response has a 3xx status code
func (o *ListClusterBackupStorageLocationUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list cluster backup storage location unauthorized response has a 4xx status code
func (o *ListClusterBackupStorageLocationUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this list cluster backup storage location unauthorized response has a 5xx status code
func (o *ListClusterBackupStorageLocationUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this list cluster backup storage location unauthorized response a status code equal to that given
func (o *ListClusterBackupStorageLocationUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *ListClusterBackupStorageLocationUnauthorized) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocationUnauthorized ", 401)
}

func (o *ListClusterBackupStorageLocationUnauthorized) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocationUnauthorized ", 401)
}

func (o *ListClusterBackupStorageLocationUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListClusterBackupStorageLocationForbidden creates a ListClusterBackupStorageLocationForbidden with default headers values
func NewListClusterBackupStorageLocationForbidden() *ListClusterBackupStorageLocationForbidden {
	return &ListClusterBackupStorageLocationForbidden{}
}

/*
ListClusterBackupStorageLocationForbidden describes a response with status code 403, with default header values.

EmptyResponse is a empty response
*/
type ListClusterBackupStorageLocationForbidden struct {
}

// IsSuccess returns true when this list cluster backup storage location forbidden response has a 2xx status code
func (o *ListClusterBackupStorageLocationForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list cluster backup storage location forbidden response has a 3xx status code
func (o *ListClusterBackupStorageLocationForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list cluster backup storage location forbidden response has a 4xx status code
func (o *ListClusterBackupStorageLocationForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this list cluster backup storage location forbidden response has a 5xx status code
func (o *ListClusterBackupStorageLocationForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this list cluster backup storage location forbidden response a status code equal to that given
func (o *ListClusterBackupStorageLocationForbidden) IsCode(code int) bool {
	return code == 403
}

func (o *ListClusterBackupStorageLocationForbidden) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocationForbidden ", 403)
}

func (o *ListClusterBackupStorageLocationForbidden) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocationForbidden ", 403)
}

func (o *ListClusterBackupStorageLocationForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListClusterBackupStorageLocationDefault creates a ListClusterBackupStorageLocationDefault with default headers values
func NewListClusterBackupStorageLocationDefault(code int) *ListClusterBackupStorageLocationDefault {
	return &ListClusterBackupStorageLocationDefault{
		_statusCode: code,
	}
}

/*
ListClusterBackupStorageLocationDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListClusterBackupStorageLocationDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list cluster backup storage location default response
func (o *ListClusterBackupStorageLocationDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list cluster backup storage location default response has a 2xx status code
func (o *ListClusterBackupStorageLocationDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list cluster backup storage location default response has a 3xx status code
func (o *ListClusterBackupStorageLocationDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list cluster backup storage location default response has a 4xx status code
func (o *ListClusterBackupStorageLocationDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list cluster backup storage location default response has a 5xx status code
func (o *ListClusterBackupStorageLocationDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list cluster backup storage location default response a status code equal to that given
func (o *ListClusterBackupStorageLocationDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListClusterBackupStorageLocationDefault) Error() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocation default  %+v", o._statusCode, o.Payload)
}

func (o *ListClusterBackupStorageLocationDefault) String() string {
	return fmt.Sprintf("[GET /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] listClusterBackupStorageLocation default  %+v", o._statusCode, o.Payload)
}

func (o *ListClusterBackupStorageLocationDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListClusterBackupStorageLocationDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
