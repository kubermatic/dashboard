package user

type DexUser interface {
	GetID() string
	GetEmail() string
	GetPassword() []byte
	GetUsername() string

	SetPassword(password string)
	SetRawPassword(password []byte)
}
