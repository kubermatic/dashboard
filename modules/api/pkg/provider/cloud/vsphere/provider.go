/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package vsphere

import (
	"context"
	"crypto/x509"
	"errors"
	"fmt"
	"net/url"
	"path"
	"strings"

	"github.com/vmware/govmomi"
	"github.com/vmware/govmomi/find"
	"github.com/vmware/govmomi/object"
	"github.com/vmware/govmomi/session"
	"github.com/vmware/govmomi/vapi/rest"
	"github.com/vmware/govmomi/vapi/tags"
	"github.com/vmware/govmomi/vim25"
	"github.com/vmware/govmomi/vim25/soap"
	"github.com/vmware/govmomi/vim25/types"

	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"

	kruntime "k8s.io/apimachinery/pkg/util/runtime"
)

// Provider represents the vsphere provider.
type Provider struct {
	dc                *kubermaticv1.DatacenterSpecVSphere
	secretKeySelector provider.SecretKeySelectorValueFunc
	caBundle          *x509.CertPool
}

// Folder represents a vsphere folder.
type Folder struct {
	Path string
}

// VMGroup represents a VMGroup.
type VMGroup struct {
	Name string
}

// NewCloudProvider creates a new vSphere provider.
func NewCloudProvider(dc *kubermaticv1.Datacenter, secretKeyGetter provider.SecretKeySelectorValueFunc, caBundle *x509.CertPool) (*Provider, error) {
	if dc.Spec.VSphere == nil {
		return nil, errors.New("datacenter is not a vSphere datacenter")
	}
	return &Provider{
		dc:                dc.Spec.VSphere,
		secretKeySelector: secretKeyGetter,
		caBundle:          caBundle,
	}, nil
}

var _ provider.CloudProvider = &Provider{}

type Session struct {
	Client     *govmomi.Client
	Finder     *find.Finder
	Datacenter *object.Datacenter
}

// Logout closes the idling vCenter connections.
func (s *Session) Logout(ctx context.Context) {
	if err := s.Client.Logout(ctx); err != nil {
		kruntime.HandleError(fmt.Errorf("vSphere client failed to logout: %w", err))
	}
}

func newSession(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) (*Session, error) {
	vim25Client, err := createVim25Client(ctx, dc, caBundle)
	if err != nil {
		return nil, err
	}

	client := &govmomi.Client{
		Client:         vim25Client,
		SessionManager: session.NewManager(vim25Client),
	}

	user := url.UserPassword(username, password)
	if dc.InfraManagementUser != nil {
		user = url.UserPassword(dc.InfraManagementUser.Username, dc.InfraManagementUser.Password)
	}

	if err = client.Login(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to login: %w", err)
	}

	finder := find.NewFinder(client.Client, true)
	datacenter, err := finder.Datacenter(ctx, dc.Datacenter)
	if err != nil {
		return nil, fmt.Errorf("failed to get vSphere datacenter %q: %w", dc.Datacenter, err)
	}
	finder.SetDatacenter(datacenter)

	return &Session{
		Datacenter: datacenter,
		Finder:     finder,
		Client:     client,
	}, nil
}

func newRESTSession(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) (*RESTSession, error) {
	vim25Client, err := createVim25Client(ctx, dc, caBundle)
	if err != nil {
		return nil, err
	}

	client := rest.NewClient(vim25Client)

	user := url.UserPassword(username, password)
	if dc.InfraManagementUser != nil {
		user = url.UserPassword(dc.InfraManagementUser.Username, dc.InfraManagementUser.Password)
	}

	if err = client.Login(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to login: %w", err)
	}

	return &RESTSession{
		Client: client,
	}, nil
}

func createVim25Client(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, caBundle *x509.CertPool) (*vim25.Client, error) {
	endpoint, err := url.Parse(dc.Endpoint)
	if err != nil {
		return nil, err
	}

	u := endpoint.JoinPath("/sdk")

	// creating the govmoni Client in roundabout way because we need to set the proper CA bundle: reference https://github.com/vmware/govmomi/issues/1200
	soapClient := soap.NewClient(u, dc.AllowInsecure)
	// set our CA bundle
	soapClient.DefaultTransport().TLSClientConfig.RootCAs = caBundle

	vim25Client, err := vim25.NewClient(ctx, soapClient)
	if err != nil {
		return nil, err
	}

	return vim25Client, err
}

// getVMRootPath is a helper func to get the root path for VM's
// We extracted it because we use it in several places.
func getVMRootPath(dc *kubermaticv1.DatacenterSpecVSphere) string {
	// Each datacenter root directory for VM's is: ${DATACENTER_NAME}/vm
	rootPath := path.Join("/", dc.Datacenter, "vm")
	// We offer a different root path though in case people would like to store all Kubermatic VM's below a certain directory
	if dc.RootPath != "" {
		rootPath = path.Clean(dc.RootPath)
	}
	return rootPath
}

// GetNetworks returns a slice of VSphereNetworks of the datacenter from the passed cloudspec.
func GetNetworks(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) ([]NetworkInfo, error) {
	// For the GetNetworks request we use dc.Spec.VSphere.InfraManagementUser
	// if set because that is the user which will ultimatively configure
	// the networks - But it means users in the UI can see vsphere
	// networks without entering credentials
	session, err := newSession(ctx, dc, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create vCenter session: %w", err)
	}
	defer session.Logout(ctx)

	return getPossibleVMNetworks(ctx, session)
}

// GetTagCategories returns a slice of VSphereTagCategory of the datacenter from the passed cloudspec.
func GetTagCategories(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) ([]tags.Category, error) {
	session, err := newRESTSession(ctx, dc, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create REST API session: %w", err)
	}
	defer session.Logout(ctx)

	tagManager := tags.NewManager(session.Client)
	categories, err := tagManager.GetCategories(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tag categories: %w", err)
	}

	return categories, err
}

// GetTagsForCategory returns a slice of VSphereTag of the datacenter from the passed cloudspec.
func GetTagsForCategory(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password, tagCategory string, caBundle *x509.CertPool) ([]tags.Tag, error) {
	session, err := newRESTSession(ctx, dc, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create REST API session: %w", err)
	}
	defer session.Logout(ctx)

	tagManager := tags.NewManager(session.Client)
	tags, err := tagManager.GetTagsForCategory(ctx, tagCategory)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tags for tag category: %w", err)
	}

	return tags, err
}

// GetVMFolders returns a slice of VSphereFolders of the datacenter from the passed cloudspec.
func GetVMFolders(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) ([]Folder, error) {
	session, err := newSession(ctx, dc, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create vCenter session: %w", err)
	}
	defer session.Logout(ctx)

	// We simply list all folders & filter out afterwards.
	// Filtering here is not possible as vCenter only lists the first level when giving a path.
	// vCenter only lists folders recursively if you just specify "*".
	folderRefs, err := session.Finder.FolderList(ctx, "*")
	if err != nil {
		return nil, fmt.Errorf("couldn't retrieve folder list: %w", err)
	}

	rootPath := getVMRootPath(dc)
	var folders []Folder
	for _, folderRef := range folderRefs {
		// We filter by rootPath. If someone configures it, we should respect it.
		if !strings.HasPrefix(folderRef.InventoryPath, rootPath+"/") && folderRef.InventoryPath != rootPath {
			continue
		}
		folder := Folder{Path: folderRef.InventoryPath}
		folders = append(folders, folder)
	}

	return folders, nil
}

// GetDatastoreList returns a slice of Datastore of the datacenter from the passed cloudspec.
func GetDatastoreList(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) ([]*object.Datastore, error) {
	session, err := newSession(ctx, dc, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create vCenter session: %w", err)
	}
	defer session.Logout(ctx)

	datastoreList, err := session.Finder.DatastoreList(ctx, "*")
	if err != nil {
		return nil, fmt.Errorf("couldn't retrieve datastore list: %w", err)
	}

	return datastoreList, nil
}

// GetVMGroupsList returns a slice of Datastore of the datacenter from the passed cloudspec.
func GetVMGroupsList(ctx context.Context, dc *kubermaticv1.DatacenterSpecVSphere, username, password string, caBundle *x509.CertPool) ([]VMGroup, error) {
	session, err := newSession(ctx, dc, username, password, caBundle)
	if err != nil {
		return nil, fmt.Errorf("failed to create vCenter session: %w", err)
	}
	defer session.Logout(ctx)

	cluster, err := session.Finder.ClusterComputeResource(ctx, dc.Cluster)
	if err != nil {
		return nil, err
	}

	clusterConfigInfoEx, err := cluster.Configuration(ctx)
	if err != nil {
		return nil, err
	}

	var vmGroups []VMGroup
	for _, group := range clusterConfigInfoEx.Group {
		if clusterVMGroup, ok := group.(*types.ClusterVmGroup); ok {
			vmGroups = append(vmGroups, VMGroup{Name: clusterVMGroup.Name})
		}
	}

	return vmGroups, nil
}

// Precedence if not infraManagementUser:
// * User from cluster
// * User from Secret
// Precedence if infraManagementUser:
// * User from clusters infraManagementUser
// * User from cluster
// * User form clusters secret infraManagementUser
// * User from clusters secret.
func getUsernameAndPassword(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc, infraManagementUser bool) (username, password string, err error) {
	if infraManagementUser {
		username = cloud.VSphere.InfraManagementUser.Username
		password = cloud.VSphere.InfraManagementUser.Password
	}
	if username == "" {
		username = cloud.VSphere.Username
	}
	if password == "" {
		password = cloud.VSphere.Password
	}

	if username != "" && password != "" {
		return username, password, nil
	}

	if cloud.VSphere.CredentialsReference == nil {
		return "", "", errors.New("cluster contains no password an and empty credentialsReference")
	}

	if username == "" && infraManagementUser {
		username, err = secretKeySelector(cloud.VSphere.CredentialsReference, resources.VsphereInfraManagementUserUsername)
		if err != nil {
			return "", "", err
		}
	}
	if username == "" {
		username, err = secretKeySelector(cloud.VSphere.CredentialsReference, resources.VsphereUsername)
		if err != nil {
			return "", "", err
		}
	}

	if password == "" && infraManagementUser {
		password, err = secretKeySelector(cloud.VSphere.CredentialsReference, resources.VsphereInfraManagementUserPassword)
		if err != nil {
			return "", "", err
		}
	}

	if password == "" {
		password, err = secretKeySelector(cloud.VSphere.CredentialsReference, resources.VspherePassword)
		if err != nil {
			return "", "", err
		}
	}

	if username == "" {
		return "", "", errors.New("unable to get username")
	}

	if password == "" {
		return "", "", errors.New("unable to get password")
	}

	return username, password, nil
}

func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc, dc *kubermaticv1.DatacenterSpecVSphere) (string, string, error) {
	var username, password string
	var err error

	// InfraManagementUser from Datacenter
	if dc != nil && dc.InfraManagementUser != nil {
		if dc.InfraManagementUser.Username != "" && dc.InfraManagementUser.Password != "" {
			return dc.InfraManagementUser.Username, dc.InfraManagementUser.Password, nil
		}
	}

	// InfraManagementUser from Cluster
	username, password, err = getUsernameAndPassword(cloud, secretKeySelector, true)
	if err != nil {
		return "", "", err
	}

	return username, password, nil
}
