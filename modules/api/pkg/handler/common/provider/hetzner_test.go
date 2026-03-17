package provider

import (
	"testing"

	"github.com/hetznercloud/hcloud-go/hcloud"
)

func TestFilterDeprecated(t *testing.T) {
	tests := []struct {
		name     string
		input    []*hcloud.ServerType
		expected int
	}{
		{
			name: "filters out API-deprecated types",
			input: []*hcloud.ServerType{
				{ID: 1, Name: "cx22", DeprecatableResource: hcloud.DeprecatableResource{Deprecation: &hcloud.DeprecationInfo{}}},
				{ID: 2, Name: "cax11"},
				{ID: 3, Name: "cx31", DeprecatableResource: hcloud.DeprecatableResource{Deprecation: &hcloud.DeprecationInfo{}}},
				{ID: 4, Name: "cax21"},
			},
			expected: 2,
		},
		{
			name: "filters out discontinued cpx types by name",
			input: []*hcloud.ServerType{
				{ID: 1, Name: "cpx11"},
				{ID: 2, Name: "cpx21"},
				{ID: 3, Name: "cpx31"},
				{ID: 4, Name: "cpx41"},
				{ID: 5, Name: "cpx51"},
				{ID: 6, Name: "cax11"},
			},
			expected: 1,
		},
		{
			name: "keeps current generation types",
			input: []*hcloud.ServerType{
				{ID: 1, Name: "cx13"},
				{ID: 2, Name: "cx23"},
				{ID: 3, Name: "cpx12"},
				{ID: 4, Name: "cpx22"},
				{ID: 5, Name: "cax11"},
				{ID: 6, Name: "ccx13"},
				{ID: 7, Name: "ccx23"},
			},
			expected: 7,
		},
		{
			name:     "handles nil slice",
			input:    nil,
			expected: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := filterDeprecated(tt.input)
			if len(result) != tt.expected {
				t.Errorf("expected %d types, got %d", tt.expected, len(result))
			}
		})
	}
}

func TestReDiscontinuedSize(t *testing.T) {
	discontinued := []string{
		"cpx11", "cpx21", "cpx31", "cpx41", "cpx51",
	}

	available := []string{
		// Current generation shared
		"cpx12", "cpx22", "cpx32", "cpx42", "cpx52",
		// Intel shared
		"cx13", "cx23", "cx33",
		// Dedicated
		"ccx13", "ccx23", "ccx33",
		// ARM
		"cax11", "cax21", "cax31",
	}

	for _, name := range discontinued {
		if !reDiscontinuedSize.MatchString(name) {
			t.Errorf("expected %q to match reDiscontinuedSize", name)
		}
	}

	for _, name := range available {
		if reDiscontinuedSize.MatchString(name) {
			t.Errorf("expected %q to NOT match reDiscontinuedSize", name)
		}
	}
}
