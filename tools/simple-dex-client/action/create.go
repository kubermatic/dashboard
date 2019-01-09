package action

import (
	"fmt"
)

type createAction struct {
	randomize   bool
	emailDomain string
	userID      string
	username    string
	email       string
	password    string
}

func (createAction) Type() ActionType {
	return Create
}

func (this createAction) Validate() error {
	if len(this.password) == 0 {
		return fmt.Errorf("password argument can not be empty when creating user")
	}

	if this.randomize {
		if len(this.emailDomain) == 0 {
			return fmt.Errorf("email domain can not be empty when using randomize option")
		}
	} else {
		if len(this.userID) == 0 || len(this.username) == 0 || len(this.email) == 0 {
			return fmt.Errorf("userid, username and email can not be empty when creating user")
		}
	}

	return nil
}

func newCreateAction(randomize bool, userID, username, email, emailDomain, password string) Action {
	return &createAction{
		randomize:   randomize,
		userID:      userID,
		username:    username,
		email:       email,
		emailDomain: emailDomain,
		password:    password,
	}
}
