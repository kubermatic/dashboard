package client

import (
	"github.com/kubermatic/dashboard-v2/tools/simple-dex-client/user"
)

type DexClient interface {
	CreateUser(user user.DexUser) error
	ListUsers() ([]user.DexUser, error)
	DeleteUser(user user.DexUser) error
}
