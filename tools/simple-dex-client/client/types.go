package client

import (
	"github.com/kubermatic/simple-dex-client/user"
)

type DexClient interface {
	CreateUser(user user.DexUser) error
	ListUsers() ([]user.DexUser, error)
	DeleteUser(user user.DexUser) error
}
