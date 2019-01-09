package main

import (
	"encoding/base64"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/kubermatic/dashboard-v2/tools/simple-dex-client/action"
	"github.com/kubermatic/dashboard-v2/tools/simple-dex-client/client"
	"github.com/kubermatic/dashboard-v2/tools/simple-dex-client/rand"
	"github.com/kubermatic/dashboard-v2/tools/simple-dex-client/user"

	"github.com/satori/go.uuid"
	"github.com/spf13/pflag"
)

var (
	argDexHost     = pflag.String("dex-host", "", "Dex gRPC API address")
	argAction      = pflag.String("action", "", "Action that should be performed on dex gRPC users API. Supported action: create, list, delete.")
	argPrefix      = pflag.String("prefix", "", "Add prefix to created user name and email.")
	argRandomize   = pflag.Bool("randomize", false, "Generate user with random id, name and email. Providing password is still required.")
	argUserID      = pflag.String("user-id", "", "User ID that should be used when creating user with randomize option disabled.")
	argUsername    = pflag.String("username", "", "Username that should be used when creating user with randomize option disabled.")
	argEmail       = pflag.String("email", "", "User email that should be used when creating user with randomize option disabled.")
	argEmailDomain = pflag.String("email-domain", "", "User email domain that should be used when creating user with randomize option enabled.")
	argPassword    = pflag.String("password", "", "User password that should be used when creating user.")

	caCertEnvName     = "CA_CERT"
	clientCertEnvName = "CLIENT_CERT"
	clientKeyEnvName  = "CLIENT_KEY"

	caCertBytes     []byte
	clientCertBytes []byte
	clientKeyBytes  []byte
)

func main() {
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	pflag.Parse()

	caCertBytes = readCertificateFromEnv(caCertEnvName)
	clientCertBytes = readCertificateFromEnv(clientCertEnvName)
	clientKeyBytes = readCertificateFromEnv(clientKeyEnvName)

	action := action.NewAction(
		*argAction,
		*argRandomize,
		*argUserID,
		*argUsername,
		*argEmail,
		*argEmailDomain,
		*argPassword,
	)
	if err := action.Validate(); err != nil {
		log.Fatalf("error during validating action: %s", err.Error())
	}

	dexClient, err := client.NewDexClient(*argDexHost, clientCertBytes, clientKeyBytes, caCertBytes)
	if err != nil {
		log.Fatalf("failed creating dex client: %v ", err)
	}

	dispatch(action, dexClient)
}

func readCertificateFromEnv(envName string) []byte {
	certEncodedString := os.Getenv(envName)
	if len(certEncodedString) == 0 {
		log.Fatalf("Environment variable %s not set", envName)
	}

	decoded, err := base64.StdEncoding.DecodeString(certEncodedString)
	if err != nil {
		log.Fatalf("Error during decoding %s: %s", envName, err.Error())
	}

	return decoded
}

func readUserFromArgs() user.DexUser {
	var id, username, email, password string

	if *argRandomize {
		username = rand.RandString()
		id = uuid.NewV4().String()
		email = username + "@" + *argEmailDomain
	} else {
		username = *argUsername
		id = *argUserID
		email = *argEmail
	}

	if len(*argPrefix) > 0 {
		username = *argPrefix + username
		email = *argPrefix + email
	}

	password = *argPassword

	return user.NewDexUser(id, username, email, password)
}

func dispatch(act action.Action, dexClient client.DexClient) {
	var err error
	switch act.Type() {
	case action.Create:
		dexUser := readUserFromArgs()
		err = dexClient.CreateUser(dexUser)
	case action.List:
		if userList, err := dexClient.ListUsers(); err == nil {
			fmt.Println(userList)
		}
	case action.Delete:
		dexUser := readUserFromArgs()
		err = dexClient.DeleteUser(dexUser)
	default:
		log.Fatalf("Action %s not supported", act)
	}

	if err != nil {
		log.Fatalf("failed to perform '%s' action: %s", act.Type(), err)
	}
}
