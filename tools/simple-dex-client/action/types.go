package action

import (
	"log"
	"strings"
)

type ActionType int

const (
	Create ActionType = iota
	List
	Delete
)

func (this ActionType) String() string {
	return []string{"Create", "List", "Delete"}[this]
}

type Action interface {
	Validate() error
	Type() ActionType
}

func NewAction(action string, randomize bool, userID, username, email, emailDomain, password string) Action {
	switch strings.ToLower(action) {
	case "create":
		return newCreateAction(randomize, userID, username, email, emailDomain, password)
	case "list":
		return newListAction()
	case "delete":
		return newDeleteAction(email)
	default:
		log.Fatalf("action '%s' not recognized", action)
	}

	return nil
}
