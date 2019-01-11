## Simple dex client
This client allows to communicate with dex gRPC API. It can:
 - Create user
 - List users
 - Delete user
 
## Enabling gRPC API
Add following lines to the dex config file:

```YAML
# Enables the gRPC API.
grpc:
  addr: 0.0.0.0:5557
  tlsCert: server.crt
  tlsKey: server.key
  tlsClientCA: ca.crt
```

## Usage
In order to connect to the dex API, secure connection has to be established using certificates.
Client loads the certificates from the environment variables on start. **All certificates have to
be base64 encoded before exporting them to the env variables.**

Example certificate:
```
-----BEGIN CERTIFICATE-----
MIIEnzCCAoegAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwEjEQMA4GA1UEAwwHZmFr
ZS1jYTAeFw0xOTAxMDkwOTM1MTZaFw0yMDAxMDkwOTM1MTZaMBYxFDASBgNVBAMM
C2Zha2Utc2VydmVyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAktXj
vDglmxUkmGerUcDquzejiy0pw/dbn3QTrA409w53PVJAxcfPJ2TEVfrX9igCYgvl
6w19ZJfxRSnH6ADQ+/gKji+YnFvfVrj+ty7bP6SnMN/iZCpGa5XLD3BAHqvWDYOn
Nl0Z8mUSW7k4NKCF/CcJOc6xhEx90bDmoC+aI+aAA/ns/ztCg5WCtpKPI0zSnvgm
HcbnS6RLx2KwkQ6WwYUwhqDgnK6BwoY2u2XxyDnOL/7U1RGd5LQo62xMdTgsSE7B
CeK2kf0BkCh9Sbb+u5ZXLIR4WsQuPX31NI/srFL0W7j/9jPiH8ADWflF/1U4ERfc
DwPlr88bzn+yfQYvXQIDAQABo4H6MIH3MAkGA1UdEwQCMAAwEQYJYIZIAYb4QgEB
BAQDAgZAMDMGCWCGSAGG+EIBDQQmFiRPcGVuU1NMIEdlbmVyYXRlZCBTZXJ2ZXIg
Q2VydGlmaWNhdGUwHQYDVR0OBBYEFFwQCn5qPutKiLcfLrC3HZFNdpqHME0GA1Ud
IwRGMESAFDUXKH6IKSSmCklqPb77xikm0Mh3oRakFDASMRAwDgYDVQQDDAdmYWtl
LWNhghQxFvDyXoUEiwCpR7dvw7AS3gWxdDAOBgNVHQ8BAf8EBAMCBaAwEwYDVR0l
BAwwCgYIKwYBBQUHAwEwDwYDVR0RBAgwBocEfwAAATANBgkqhkiG9w0BAQsFAAOC
AgEAOY9aewC7vgNYxB2ba9Eh/66mCFiAz3Lq8dSrA+xQgg6jTc8YjxMrPQkS/d6a
JZOP9Q0mjdnnR3+GGg1/5RXnGFsGnLVOKSguIYP31PjCa6NnW5eLhmxVreUUsw4G
fjatBh6cEbJURegKFN76tnvKQlw4/oYDuT8uYbdn3TjEWtrzH1lbS0hzXItVbY6G
MYG/GS6kn5JHPSnMKqw62s8sKPemsjQroduup9sqmy6SGzJhWX/7z0rTNXzT5Jab
stK0+LoD2jIuItPG2RSg6ARfKXIPOCgZV7tsdggQ1PRRC4lziW35Q7PxaBF2EH5T
jS87hU2YxKQjR9I/SDnwOZtDiO1JaZBQ1Uz5JnaXP9t+AQXxwKDpH9siUZQkXBwC
JPjsh/mANWM25mXlOGvqKd798tEibd5okEBaifEZvSpLloq11kSZAe9TCY7zEu5J
NjKR66EGXwmeuesFPxCqkIX1fB9sRUNvQikVidRjP8YI/PLHUahNjGDZDpHl/1R1
Z9A1kz4dntha4mvfMcxfcadvW9YqYktkxwk2Y3OncQvBTw82C16P2oiB4r8woo16
c5J8bYDmPjuukzRW5YYIf1oRN5KM6uYoVDBeMCQHmskNcIbXBKcS2UY/uQJ0xdt4
zag/wIFkbyhx14jP4HyMsUrhw3xljdoRRVxAWuWO1cBgdqU=
-----END CERTIFICATE-----
```

Base64 online encoder: https://www.base64encode.org/

Encoded certificate:
```
LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVuekNDQW9lZ0F3SUJBZ0lDRUFBd0RRWUpLb1pJaHZjTkFRRUxCUUF3RWpFUU1BNEdBMVVFQXd3SFptRnIKWlMxallUQWVGdzB4T1RBeE1Ea3dPVE0xTVRaYUZ3MHlNREF4TURrd09UTTFNVFphTUJZeEZEQVNCZ05WQkFNTQpDMlpoYTJVdGMyVnlkbVZ5TUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUFrdFhqCnZEZ2xteFVrbUdlclVjRHF1emVqaXkwcHcvZGJuM1FUckE0MDl3NTNQVkpBeGNmUEoyVEVWZnJYOWlnQ1lndmwKNncxOVpKZnhSU25INkFEUSsvZ0tqaStZbkZ2ZlZyait0eTdiUDZTbk1OL2laQ3BHYTVYTEQzQkFIcXZXRFlPbgpObDBaOG1VU1c3azROS0NGL0NjSk9jNnhoRXg5MGJEbW9DK2FJK2FBQS9ucy96dENnNVdDdHBLUEkwelNudmdtCkhjYm5TNlJMeDJLd2tRNld3WVV3aHFEZ25LNkJ3b1kydTJYeHlEbk9MLzdVMVJHZDVMUW82MnhNZFRnc1NFN0IKQ2VLMmtmMEJrQ2g5U2JiK3U1WlhMSVI0V3NRdVBYMzFOSS9zckZMMFc3ai85alBpSDhBRFdmbEYvMVU0RVJmYwpEd1Bscjg4YnpuK3lmUVl2WFFJREFRQUJvNEg2TUlIM01Ba0dBMVVkRXdRQ01BQXdFUVlKWUlaSUFZYjRRZ0VCCkJBUURBZ1pBTURNR0NXQ0dTQUdHK0VJQkRRUW1GaVJQY0dWdVUxTk1JRWRsYm1WeVlYUmxaQ0JUWlhKMlpYSWcKUTJWeWRHbG1hV05oZEdVd0hRWURWUjBPQkJZRUZGd1FDbjVxUHV0S2lMY2ZMckMzSFpGTmRwcUhNRTBHQTFVZApJd1JHTUVTQUZEVVhLSDZJS1NTbUNrbHFQYjc3eGlrbTBNaDNvUmFrRkRBU01SQXdEZ1lEVlFRRERBZG1ZV3RsCkxXTmhnaFF4RnZEeVhvVUVpd0NwUjdkdnc3QVMzZ1d4ZERBT0JnTlZIUThCQWY4RUJBTUNCYUF3RXdZRFZSMGwKQkF3d0NnWUlLd1lCQlFVSEF3RXdEd1lEVlIwUkJBZ3dCb2NFZndBQUFUQU5CZ2txaGtpRzl3MEJBUXNGQUFPQwpBZ0VBT1k5YWV3Qzd2Z05ZeEIyYmE5RWgvNjZtQ0ZpQXozTHE4ZFNyQSt4UWdnNmpUYzhZanhNclBRa1MvZDZhCkpaT1A5UTBtamRublIzK0dHZzEvNVJYbkdGc0duTFZPS1NndUlZUDMxUGpDYTZOblc1ZUxobXhWcmVVVXN3NEcKZmphdEJoNmNFYkpVUmVnS0ZONzZ0bnZLUWx3NC9vWUR1VDh1WWJkbjNUakVXdHJ6SDFsYlMwaHpYSXRWYlk2RwpNWUcvR1M2a241SkhQU25NS3F3NjJzOHNLUGVtc2pRcm9kdXVwOXNxbXk2U0d6SmhXWC83ejByVE5YelQ1SmFiCnN0SzArTG9EMmpJdUl0UEcyUlNnNkFSZktYSVBPQ2daVjd0c2RnZ1ExUFJSQzRsemlXMzVRN1B4YUJGMkVINVQKalM4N2hVMll4S1FqUjlJL1NEbndPWnREaU8xSmFaQlExVXo1Sm5hWFA5dCtBUVh4d0tEcEg5c2lVWlFrWEJ3QwpKUGpzaC9tQU5XTTI1bVhsT0d2cUtkNzk4dEVpYmQ1b2tFQmFpZkVadlNwTGxvcTExa1NaQWU5VENZN3pFdTVKCk5qS1I2NkVHWHdtZXVlc0ZQeENxa0lYMWZCOXNSVU52UWlrVmlkUmpQOFlJL1BMSFVhaE5qR0RaRHBIbC8xUjEKWjlBMWt6NGRudGhhNG12Zk1jeGZjYWR2VzlZcVlrdGt4d2syWTNPbmNRdkJUdzgyQzE2UDJvaUI0cjh3b28xNgpjNUo4YllEbVBqdXVrelJXNVlZSWYxb1JONUtNNnVZb1ZEQmVNQ1FIbXNrTmNJYlhCS2NTMlVZL3VRSjB4ZHQ0CnphZy93SUZrYnloeDE0alA0SHlNc1VyaHczeGxqZG9SUlZ4QVd1V08xY0JnZHFVPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0t
```

Environment variables:
 - `CA_CERT`
 - `CLIENT_CERT`
 - `CLIENT_KEY`
 
Application arguments:
 - `--dex-host` - Dex gRPC API address
 - `--action` - Action that should be performed on dex gRPC users API. Supported actions: create, list, delete
 - `--prefix` - Add prefix to the created user name and email
 - `--randomize` - Generate user with random id, name and email. Providing password and email domain is still required.
 - `--user-id` - User ID that should be used when creating user with randomize option disabled
 - `--username` - Username that should be used when creating user with randomize option disabled
 - `--email` - User email that should be used when creating user with randomize option disabled
 - `--email-domain` - User email domain that should be used when creating user with randomize option enabled
 - `--password` - User password that should be used when creating user
 
### Example
Create an user with random name and `e2e-` prefix:
 ```bash
 $ ./simple-dex-client --dex-host="127.0.0.1:5557" --action="create" --prefix="e2e-" --randomize --email-domain="example.com" --password="testpwd"
 ```
 
Delete user with email `test@example.com`:
```bash
$ ./simple-dex-client --dex-host="127.0.0.1:5557" --action="delete" --email="test@example.com"
```

List users:
```bash
$ ./simple-dex-client --dex-host="127.0.0.1:5557" --action="list"

```