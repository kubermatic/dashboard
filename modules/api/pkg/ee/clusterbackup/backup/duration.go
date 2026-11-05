//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2026 Kubermatic GmbH

   1.	You may only view, read and display for studying purposes the source
      code of the software licensed under this license, and, to the extent
      explicitly provided under this license, the binary code.
   2.	Any use of the software which exceeds the foregoing right, including,
      without limitation, its execution, compilation, copying, modification
      and distribution, is expressly prohibited.
   3.	THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   END OF TERMS AND CONDITIONS
*/

package clusterbackup

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"

	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"
)

const hoursPerDay = 24

var (
	durationDaysPrefix  = regexp.MustCompile(`^[0-9]+d`)
	durationDaysPattern = regexp.MustCompile(`^([0-9]+)d(?:([01]?[0-9]|2[0-3])h)?((?:[0-5]?[0-9]m)?(?:[0-5]?[0-9]s)?)$`)
)

func NormalizeDurationDays(duration string) (string, error) {
	if !durationDaysPrefix.MatchString(duration) {
		return duration, nil
	}

	match := durationDaysPattern.FindStringSubmatch(duration)
	if match == nil {
		return "", fmt.Errorf("invalid duration %q: after days, hours must be below %d and minutes and seconds below 60, in that order", duration, hoursPerDay)
	}

	days, err := strconv.Atoi(match[1])
	if err != nil {
		return "", fmt.Errorf("invalid duration %q: %w", duration, err)
	}

	hours := 0
	if match[2] != "" {
		hours, err = strconv.Atoi(match[2])
		if err != nil {
			return "", fmt.Errorf("invalid duration %q: %w", duration, err)
		}
	}

	normalized := fmt.Sprintf("%dh%s", days*hoursPerDay+hours, match[3])
	if _, err := time.ParseDuration(normalized); err != nil {
		return "", fmt.Errorf("invalid duration %q: %w", duration, err)
	}

	return normalized, nil
}

func NormalizeBodyDuration(body []byte, path ...string) ([]byte, error) {
	if len(path) == 0 {
		return body, nil
	}

	var doc map[string]any
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.UseNumber()
	if err := decoder.Decode(&doc); err != nil {
		return nil, err
	}

	node := doc
	for _, key := range path[:len(path)-1] {
		next, ok := node[key].(map[string]any)
		if !ok {
			return body, nil
		}
		node = next
	}

	last := path[len(path)-1]
	duration, ok := node[last].(string)
	if !ok {
		return body, nil
	}

	normalized, err := NormalizeDurationDays(duration)
	if err != nil {
		return nil, utilerrors.NewBadRequest("%v", err)
	}
	if normalized == duration {
		return body, nil
	}

	node[last] = normalized
	return json.Marshal(doc)
}

func DecodeBody(r *http.Request, target any, path ...string) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}
	body, err = NormalizeBodyDuration(body, path...)
	if err != nil {
		return err
	}
	return json.Unmarshal(body, target)
}
