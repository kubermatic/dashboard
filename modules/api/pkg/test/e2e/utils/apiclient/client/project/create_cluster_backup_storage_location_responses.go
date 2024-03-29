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

// CreateClusterBackupStorageLocationReader is a Reader for the CreateClusterBackupStorageLocation structure.
type CreateClusterBackupStorageLocationReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *CreateClusterBackupStorageLocationReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 201:
		result := NewCreateClusterBackupStorageLocationCreated()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewCreateClusterBackupStorageLocationUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 403:
		result := NewCreateClusterBackupStorageLocationForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewCreateClusterBackupStorageLocationDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewCreateClusterBackupStorageLocationCreated creates a CreateClusterBackupStorageLocationCreated with default headers values
func NewCreateClusterBackupStorageLocationCreated() *CreateClusterBackupStorageLocationCreated {
	return &CreateClusterBackupStorageLocationCreated{}
}

/*
CreateClusterBackupStorageLocationCreated describes a response with status code 201, with default header values.

ClusterBackupStorageLocation
*/
type CreateClusterBackupStorageLocationCreated struct {
	Payload *models.ClusterBackupStorageLocation
}

// IsSuccess returns true when this create cluster backup storage location created response has a 2xx status code
func (o *CreateClusterBackupStorageLocationCreated) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this create cluster backup storage location created response has a 3xx status code
func (o *CreateClusterBackupStorageLocationCreated) IsRedirect() bool {
	return false
}

// IsClientError returns true when this create cluster backup storage location created response has a 4xx status code
func (o *CreateClusterBackupStorageLocationCreated) IsClientError() bool {
	return false
}

// IsServerError returns true when this create cluster backup storage location created response has a 5xx status code
func (o *CreateClusterBackupStorageLocationCreated) IsServerError() bool {
	return false
}

// IsCode returns true when this create cluster backup storage location created response a status code equal to that given
func (o *CreateClusterBackupStorageLocationCreated) IsCode(code int) bool {
	return code == 201
}

func (o *CreateClusterBackupStorageLocationCreated) Error() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocationCreated  %+v", 201, o.Payload)
}

func (o *CreateClusterBackupStorageLocationCreated) String() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocationCreated  %+v", 201, o.Payload)
}

func (o *CreateClusterBackupStorageLocationCreated) GetPayload() *models.ClusterBackupStorageLocation {
	return o.Payload
}

func (o *CreateClusterBackupStorageLocationCreated) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ClusterBackupStorageLocation)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewCreateClusterBackupStorageLocationUnauthorized creates a CreateClusterBackupStorageLocationUnauthorized with default headers values
func NewCreateClusterBackupStorageLocationUnauthorized() *CreateClusterBackupStorageLocationUnauthorized {
	return &CreateClusterBackupStorageLocationUnauthorized{}
}

/*
CreateClusterBackupStorageLocationUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type CreateClusterBackupStorageLocationUnauthorized struct {
}

// IsSuccess returns true when this create cluster backup storage location unauthorized response has a 2xx status code
func (o *CreateClusterBackupStorageLocationUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this create cluster backup storage location unauthorized response has a 3xx status code
func (o *CreateClusterBackupStorageLocationUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this create cluster backup storage location unauthorized response has a 4xx status code
func (o *CreateClusterBackupStorageLocationUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this create cluster backup storage location unauthorized response has a 5xx status code
func (o *CreateClusterBackupStorageLocationUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this create cluster backup storage location unauthorized response a status code equal to that given
func (o *CreateClusterBackupStorageLocationUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *CreateClusterBackupStorageLocationUnauthorized) Error() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocationUnauthorized ", 401)
}

func (o *CreateClusterBackupStorageLocationUnauthorized) String() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocationUnauthorized ", 401)
}

func (o *CreateClusterBackupStorageLocationUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewCreateClusterBackupStorageLocationForbidden creates a CreateClusterBackupStorageLocationForbidden with default headers values
func NewCreateClusterBackupStorageLocationForbidden() *CreateClusterBackupStorageLocationForbidden {
	return &CreateClusterBackupStorageLocationForbidden{}
}

/*
CreateClusterBackupStorageLocationForbidden describes a response with status code 403, with default header values.

EmptyResponse is a empty response
*/
type CreateClusterBackupStorageLocationForbidden struct {
}

// IsSuccess returns true when this create cluster backup storage location forbidden response has a 2xx status code
func (o *CreateClusterBackupStorageLocationForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this create cluster backup storage location forbidden response has a 3xx status code
func (o *CreateClusterBackupStorageLocationForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this create cluster backup storage location forbidden response has a 4xx status code
func (o *CreateClusterBackupStorageLocationForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this create cluster backup storage location forbidden response has a 5xx status code
func (o *CreateClusterBackupStorageLocationForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this create cluster backup storage location forbidden response a status code equal to that given
func (o *CreateClusterBackupStorageLocationForbidden) IsCode(code int) bool {
	return code == 403
}

func (o *CreateClusterBackupStorageLocationForbidden) Error() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocationForbidden ", 403)
}

func (o *CreateClusterBackupStorageLocationForbidden) String() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocationForbidden ", 403)
}

func (o *CreateClusterBackupStorageLocationForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewCreateClusterBackupStorageLocationDefault creates a CreateClusterBackupStorageLocationDefault with default headers values
func NewCreateClusterBackupStorageLocationDefault(code int) *CreateClusterBackupStorageLocationDefault {
	return &CreateClusterBackupStorageLocationDefault{
		_statusCode: code,
	}
}

/*
CreateClusterBackupStorageLocationDefault describes a response with status code -1, with default header values.

errorResponse
*/
type CreateClusterBackupStorageLocationDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the create cluster backup storage location default response
func (o *CreateClusterBackupStorageLocationDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this create cluster backup storage location default response has a 2xx status code
func (o *CreateClusterBackupStorageLocationDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this create cluster backup storage location default response has a 3xx status code
func (o *CreateClusterBackupStorageLocationDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this create cluster backup storage location default response has a 4xx status code
func (o *CreateClusterBackupStorageLocationDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this create cluster backup storage location default response has a 5xx status code
func (o *CreateClusterBackupStorageLocationDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this create cluster backup storage location default response a status code equal to that given
func (o *CreateClusterBackupStorageLocationDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *CreateClusterBackupStorageLocationDefault) Error() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocation default  %+v", o._statusCode, o.Payload)
}

func (o *CreateClusterBackupStorageLocationDefault) String() string {
	return fmt.Sprintf("[POST /api/v2/projects/{project_id}/clusterbackupstoragelocation][%d] createClusterBackupStorageLocation default  %+v", o._statusCode, o.Payload)
}

func (o *CreateClusterBackupStorageLocationDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *CreateClusterBackupStorageLocationDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
