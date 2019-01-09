package action

import (
	"fmt"
)

type deleteAction struct {
	email string
}

func (deleteAction) Type() ActionType {
	return Delete
}

func (this deleteAction) Validate() error {
	if len(this.email) == 0 {
		return fmt.Errorf("email is required when deleting user")
	}

	return nil
}

func newDeleteAction(email string) Action {
	return &deleteAction{email: email}
}
