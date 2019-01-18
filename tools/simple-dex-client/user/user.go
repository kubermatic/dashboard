package user

import (
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type dexUser struct {
	id       string
	username string
	email    string
	password []byte
}

func (this *dexUser) GetID() string {
	return this.id
}

func (this *dexUser) GetEmail() string {
	return this.email
}

func (this *dexUser) GetPassword() []byte {
	return this.password
}

func (this *dexUser) GetUsername() string {
	return this.username
}

func (this *dexUser) SetPassword(password string) {
	pwdBytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		panic(err)
	}

	this.password = pwdBytes
}

func (this *dexUser) SetRawPassword(password []byte) {
	this.password = password
}

func (this *dexUser) String() string {
	builder := strings.Builder{}

	builder.WriteString("\nID: ")
	builder.WriteString(this.id)

	builder.WriteString("\nUsername: ")
	builder.WriteString(this.username)

	builder.WriteString("\nEmail: ")
	builder.WriteString(this.email)

	if len(this.password) > 0 {
		builder.WriteString("\nPassword: ")
		builder.Write(this.password)
	}

	builder.WriteRune('\n')

	return builder.String()
}

func NewDexUser(id, username, email, password string) DexUser {
	user := &dexUser{
		id:       id,
		email:    email,
		username: username,
	}

	user.SetPassword(password)

	return user
}

func NewSimpleDexUser(id, username, email string) DexUser {
	return &dexUser{
		id:       id,
		email:    email,
		username: username,
	}
}
