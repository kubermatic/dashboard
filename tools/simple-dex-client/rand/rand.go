package rand

import (
	"math/rand"
	"time"
)

const (
	alphabet            = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
	defaultStringLength = 10
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func RandString(lengthArg ...int) string {
	length := defaultStringLength
	if len(lengthArg) == 1 {
		length = lengthArg[0]
	}

	b := make([]byte, length)
	for i := range b {
		b[i] = alphabet[rand.Intn(len(alphabet))]
	}
	return string(b)
}
