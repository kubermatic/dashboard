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

package project

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-kit/kit/endpoint"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/middleware"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	kubermaticv1helper "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1/helper"
	"k8c.io/kubermatic/v2/pkg/controller/master-controller-manager/rbac"
	"k8c.io/kubermatic/v2/pkg/log"
	utilerrors "k8c.io/kubermatic/v2/pkg/util/errors"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/util/sets"
)

// CreateEndpoint defines an HTTP endpoint that creates a new project in the system.
func CreateEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider, memberMapper provider.ProjectMemberMapper, memberProvider provider.ProjectMemberProvider, privilegedMemberProvider provider.PrivilegedProjectMemberProvider, userProvider provider.UserProvider) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		projectRq, ok := request.(projectReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}

		if len(projectRq.Body.Name) == 0 {
			return nil, utilerrors.NewBadRequest("the name of the project cannot be empty")
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		user := ctx.Value(middleware.UserCRContextKey).(*kubermaticv1.User)

		if err := checkProjectCreationRestriction(user, settings); err != nil {
			return nil, err
		}

		if err := validateUserProjectsLimit(ctx, user, settings, projectProvider, privilegedProjectProvider, memberMapper, memberProvider, userProvider); err != nil {
			return nil, err
		}

		userEmail := user.Spec.Email
		if kubermaticv1helper.IsProjectServiceAccount(userEmail) {
			return createProjectByServiceAccount(ctx, userEmail, projectRq, memberMapper, userProvider, privilegedMemberProvider, projectProvider)
		}

		projectSpec := &kubermaticv1.ProjectSpec{
			Name:                    projectRq.Body.Name,
			AllowedOperatingSystems: projectRq.Body.Spec.AllowedOperatingSystems,
		}
		// create the project
		kubermaticProject, err := projectProvider.New(ctx, projectSpec, projectRq.Body.Labels)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		// bind user to the project
		generatedGroupName := rbac.GenerateActualGroupNameFor(kubermaticProject.Name, rbac.OwnerGroupNamePrefix)

		_, err = privilegedMemberProvider.CreateUnsecured(ctx, kubermaticProject, userEmail, generatedGroupName)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		owners := []apiv1.User{
			{
				ObjectMeta: apiv1.ObjectMeta{
					Name: user.Spec.Name,
				},
				Email: userEmail,
			},
		}

		return common.ConvertInternalProjectToExternal(kubermaticProject, owners, 0), nil
	}
}

func createProjectByServiceAccount(ctx context.Context, saEmail string, projectReq projectReq, memberMapper provider.ProjectMemberMapper, userProvider provider.UserProvider, memberProvider provider.PrivilegedProjectMemberProvider, projectProvider provider.ProjectProvider) (*apiv1.Project, error) {
	bindings, err := memberMapper.MappingsFor(ctx, saEmail)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	if len(bindings) == 0 {
		return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("no bindings for service account user %s", saEmail))
	}
	saBinding := bindings[0]
	if !strings.HasPrefix(saBinding.Spec.Group, rbac.ProjectManagerGroupNamePrefix) {
		return nil, utilerrors.New(http.StatusForbidden, "the Service Account is not allowed to create a project")
	}

	// determine regular (human) users that will own the project
	var humanUserOwnerList []*kubermaticv1.User

	for _, userEmail := range projectReq.Body.Users {
		if kubermaticv1helper.IsProjectServiceAccount(userEmail) {
			return nil, utilerrors.New(http.StatusBadRequest, "user email list should contain only human users")
		}
		humanUserOwner, err := userProvider.UserByEmail(ctx, userEmail)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		humanUserOwnerList = append(humanUserOwnerList, humanUserOwner)
	}

	if len(humanUserOwnerList) == 0 {
		return nil, utilerrors.New(http.StatusBadRequest, "owner user email list required for project creation by Service Account")
	}

	projectSpec := &kubermaticv1.ProjectSpec{
		Name:                    projectReq.Body.Name,
		AllowedOperatingSystems: projectReq.Body.Spec.AllowedOperatingSystems,
	}
	// create the project
	kubermaticProject, err := projectProvider.New(ctx, projectSpec, projectReq.Body.Labels)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	// bind Service Account to the project
	generatedGroupName := rbac.GenerateActualGroupNameFor(kubermaticProject.Name, rbac.ProjectManagerGroupNamePrefix)

	_, err = memberProvider.CreateUnsecuredForServiceAccount(ctx, kubermaticProject, saEmail, generatedGroupName)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	// bind all regular users to the project
	for _, user := range humanUserOwnerList {
		_, err = memberProvider.CreateUnsecured(ctx, kubermaticProject, user.Spec.Email, generatedGroupName)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
	}

	var owners []apiv1.User
	for _, owner := range humanUserOwnerList {
		owners = append(owners, apiv1.User{
			ObjectMeta: apiv1.ObjectMeta{
				Name: owner.Spec.Name,
			},
			Email: owner.Spec.Email,
		})
	}

	return common.ConvertInternalProjectToExternal(kubermaticProject, owners, 0), nil
}

func checkProjectCreationRestriction(user *kubermaticv1.User, settings *kubermaticv1.KubermaticSetting) error {
	if user.Spec.IsAdmin {
		return nil
	}
	if settings.Spec.RestrictProjectCreation {
		return utilerrors.New(http.StatusForbidden, "project creation is restricted")
	}
	return nil
}

func checkProjectDeletionRestriction(user *kubermaticv1.User, settings *kubermaticv1.KubermaticSetting) error {
	if user.Spec.IsAdmin {
		return nil
	}
	if settings.Spec.RestrictProjectDeletion {
		return utilerrors.New(http.StatusForbidden, "project deletion is restricted")
	}
	return nil
}

func checkProjectModificationRestriction(user *kubermaticv1.User, settings *kubermaticv1.KubermaticSetting) error {
	if user.Spec.IsAdmin {
		return nil
	}
	if settings.Spec.RestrictProjectModification {
		return utilerrors.New(http.StatusForbidden, "project modification is restricted")
	}
	return nil
}

func validateUserProjectsLimit(ctx context.Context, user *kubermaticv1.User, settings *kubermaticv1.KubermaticSetting, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, memberMapper provider.ProjectMemberMapper, memberProvider provider.ProjectMemberProvider, userProvider provider.UserProvider) error {
	if user.Spec.IsAdmin {
		return nil
	}
	if settings.Spec.UserProjectsLimit <= 0 {
		return nil
	}

	userMappings, err := memberMapper.MappingsFor(ctx, user.Spec.Email)
	if err != nil {
		return common.KubernetesErrorToHTTPError(err)
	}
	var errorList []string
	var projectsCounter int64
	for _, mapping := range userMappings {
		userInfo := &provider.UserInfo{Email: mapping.Spec.UserEmail, Groups: []string{mapping.Spec.Group}}
		projectInternal, err := projectProvider.Get(ctx, userInfo, mapping.Spec.ProjectID, &provider.ProjectGetOptions{IncludeUninitialized: true})
		if err != nil {
			// Request came from the specified user. Instead `Not found` error status the `Forbidden` is returned.
			// Next request with privileged user checks if the project doesn't exist or some other error occurred.
			if !isStatus(err, http.StatusForbidden) {
				errorList = append(errorList, err.Error())
				continue
			}
			_, errGetUnsecured := privilegedProjectProvider.GetUnsecured(ctx, mapping.Spec.ProjectID, &provider.ProjectGetOptions{IncludeUninitialized: true})
			if !isStatus(errGetUnsecured, http.StatusNotFound) {
				// store original error
				errorList = append(errorList, err.Error())
			}
			continue
		}
		// get only owned projects
		projectOwners, err := common.GetOwnersForProject(ctx, userInfo, projectInternal, memberProvider, userProvider)
		if err != nil {
			return common.KubernetesErrorToHTTPError(err)
		}
		for _, owner := range projectOwners {
			if strings.EqualFold(owner.Email, user.Spec.Email) {
				projectsCounter++
			}
		}
	}
	if len(errorList) > 0 {
		return utilerrors.NewWithDetails(http.StatusInternalServerError, "failed to get some projects, please examine details field for more info", errorList)
	}

	if projectsCounter >= settings.Spec.UserProjectsLimit {
		return utilerrors.New(http.StatusForbidden, "reached maximum number of projects")
	}
	return nil
}

// ListEndpoint defines an HTTP endpoint for listing projects.
func ListEndpoint(userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, memberMapper provider.ProjectMemberMapper, memberProvider provider.ProjectMemberProvider, userProvider provider.UserProvider, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(ListReq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		userInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		if req.DisplayAll && (userInfo.IsAdmin || userInfo.IsGlobalViewer) {
			return getAllProjectsForAdmin(ctx, userInfo, projectProvider, memberProvider, userProvider, clusterProviderGetter, seedsGetter)
		}

		var projects []*kubermaticv1.Project
		projectIDSet := sets.New[string]()

		userMappings, err := memberMapper.MappingsFor(ctx, userInfo.Email)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		var errorList []string
		for _, mapping := range userMappings {
			userInfo := &provider.UserInfo{
				Email:   mapping.Spec.UserEmail,
				IsAdmin: userInfo.IsAdmin,
				Roles:   userInfo.Roles,
				Groups:  append(userInfo.Groups, mapping.Spec.Group),
			}

			projectInternal, err := projectProvider.Get(ctx, userInfo, mapping.Spec.ProjectID, &provider.ProjectGetOptions{IncludeUninitialized: true})
			if err != nil {
				if isStatus(err, http.StatusNotFound) {
					continue
				}

				// Request came from the specified user. Instead `Not found` error status the `Forbidden` is returned.
				// Next request with privileged user checks if the project doesn't exist or some other error occurred.
				if !isStatus(err, http.StatusForbidden) {
					errorList = append(errorList, err.Error())
					continue
				}
				_, errGetUnsecured := privilegedProjectProvider.GetUnsecured(ctx, mapping.Spec.ProjectID, &provider.ProjectGetOptions{IncludeUninitialized: true})
				if errGetUnsecured != nil && !isStatus(errGetUnsecured, http.StatusNotFound) {
					// store original error
					errorList = append(errorList, err.Error())
				}
				continue
			}
			projects = append(projects, projectInternal)
			projectIDSet.Insert(projectInternal.Name)
		}

		groupMappings, err := memberMapper.GroupMappingsFor(ctx, userInfo.Groups)
		if err != nil {
			return nil, err
		}

		for _, group := range groupMappings {
			projectID := group.Spec.ProjectID

			if projectIDSet.Has(projectID) {
				// The project has been already added either from user or other group bindings.
				continue
			}

			// Create a temporary user info with projectId-suffixed group name to allow for get project request.
			projectUserInfo := &provider.UserInfo{
				Email:   userInfo.Email,
				Groups:  append(userInfo.Groups, fmt.Sprintf("%s-%s", group.Spec.Group, projectID)),
				Roles:   userInfo.Roles,
				IsAdmin: userInfo.IsAdmin,
			}

			project, err := projectProvider.Get(ctx, projectUserInfo, projectID, &provider.ProjectGetOptions{IncludeUninitialized: true})
			if err != nil {
				if isStatus(err, http.StatusNotFound) {
					continue
				}
				errorList = append(errorList, err.Error())
				continue
			}
			projects = append(projects, project)
			projectIDSet.Insert(project.Name)
		}

		var apiProjects []*apiv1.Project
		for _, project := range projects {
			projectOwners, err := common.GetOwnersForProject(ctx, userInfo, project, memberProvider, userProvider)
			if err != nil {
				return nil, common.KubernetesErrorToHTTPError(err)
			}
			clustersNumber, err := getNumberOfClustersForProject(ctx, clusterProviderGetter, seedsGetter, project)
			if err != nil {
				return nil, common.KubernetesErrorToHTTPError(err)
			}
			apiProjects = append(apiProjects, common.ConvertInternalProjectToExternal(project, projectOwners, clustersNumber))
		}

		if len(errorList) > 0 {
			return nil, utilerrors.NewWithDetails(http.StatusInternalServerError, "failed to get some projects, please examine details field for more info", errorList)
		}
		return apiProjects, nil
	}
}

func getAllProjectsForAdmin(ctx context.Context, userInfo *provider.UserInfo, projectProvider provider.ProjectProvider, memberProvider provider.ProjectMemberProvider, userProvider provider.UserProvider, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter) ([]*apiv1.Project, error) {
	projects := []*apiv1.Project{}
	projectList, err := projectProvider.List(ctx, nil)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}

	clustersNumbers, err := getNumberOfClusters(ctx, clusterProviderGetter, seedsGetter)
	if err != nil {
		return nil, common.KubernetesErrorToHTTPError(err)
	}
	for _, project := range projectList {
		projectOwners, err := common.GetOwnersForProject(ctx, userInfo, project, memberProvider, userProvider)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		projects = append(projects, common.ConvertInternalProjectToExternal(project, projectOwners, clustersNumbers[project.Name]))
	}

	return projects, nil
}

func isStatus(err error, status int32) bool {
	var statusErr *apierrors.StatusError

	return errors.As(err, &statusErr) && status == statusErr.Status().Code
}

// DeleteEndpoint defines an HTTP endpoint for deleting a project.
func DeleteEndpoint(projectProvider provider.ProjectProvider, settingsProvider provider.SettingsProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, userInfoGetter provider.UserInfoGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(deleteRq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		if len(req.ProjectID) == 0 {
			return nil, utilerrors.NewBadRequest("the id of the project cannot be empty")
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		user := ctx.Value(middleware.UserCRContextKey).(*kubermaticv1.User)

		if err := checkProjectDeletionRestriction(user, settings); err != nil {
			return nil, err
		}
		// check if admin user
		adminUserInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		// allow to delete any project for the admin user
		if adminUserInfo.IsAdmin {
			err := privilegedProjectProvider.DeleteUnsecured(ctx, req.ProjectID)
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		return nil, deleteProjectByRegularUser(ctx, userInfoGetter, projectProvider, req.ProjectID)
	}
}

func deleteProjectByRegularUser(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, projectID string) error {
	userInfo, err := userInfoGetter(ctx, projectID)
	if err != nil {
		return common.KubernetesErrorToHTTPError(err)
	}
	err = projectProvider.Delete(ctx, userInfo, projectID)
	return common.KubernetesErrorToHTTPError(err)
}

// UpdateEndpoint defines an HTTP endpoint that updates an existing project in the system
// in the current implementation only project renaming is supported.
func UpdateEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, settingsProvider provider.SettingsProvider, memberProvider provider.ProjectMemberProvider, userProvider provider.UserProvider, userInfoGetter provider.UserInfoGetter, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(updateRq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		err := req.validate()
		if err != nil {
			return nil, utilerrors.NewBadRequest("%v", err)
		}

		settings, err := settingsProvider.GetGlobalSettings(ctx)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		user := ctx.Value(middleware.UserCRContextKey).(*kubermaticv1.User)

		if err := checkProjectModificationRestriction(user, settings); err != nil {
			return nil, err
		}

		kubermaticProject, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		kubermaticProject.Spec.Name = req.Body.Name
		kubermaticProject.Labels = req.Body.Labels
		kubermaticProject.Spec.AllowedOperatingSystems = req.Body.Spec.AllowedOperatingSystems

		project, err := updateProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, kubermaticProject)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		adminUserInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		projectOwners, err := common.GetOwnersForProject(ctx, adminUserInfo, kubermaticProject, memberProvider, userProvider)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		clustersNumber, err := getNumberOfClustersForProject(ctx, clusterProviderGetter, seedsGetter, project)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		return common.ConvertInternalProjectToExternal(project, projectOwners, clustersNumber), nil
	}
}

func updateProject(ctx context.Context, userInfoGetter provider.UserInfoGetter, projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, kubermaticProject *kubermaticv1.Project) (*kubermaticv1.Project, error) {
	adminUserInfo, err := userInfoGetter(ctx, "")
	if err != nil {
		return nil, err
	}

	if adminUserInfo.IsAdmin {
		return privilegedProjectProvider.UpdateUnsecured(ctx, kubermaticProject)
	}
	userInfo, err := userInfoGetter(ctx, kubermaticProject.Name)
	if err != nil {
		return nil, err
	}
	return projectProvider.Update(ctx, userInfo, kubermaticProject)
}

// GeEndpoint defines an HTTP endpoint for getting a project.
func GetEndpoint(projectProvider provider.ProjectProvider, privilegedProjectProvider provider.PrivilegedProjectProvider, memberProvider provider.ProjectMemberProvider, userProvider provider.UserProvider, userInfoGetter provider.UserInfoGetter, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req, ok := request.(common.GetProjectRq)
		if !ok {
			return nil, utilerrors.NewBadRequest("invalid request")
		}
		if len(req.ProjectID) == 0 {
			return nil, utilerrors.NewBadRequest("the id of the project cannot be empty")
		}

		adminUserInfo, err := userInfoGetter(ctx, "")
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		kubermaticProject, err := common.GetProject(ctx, userInfoGetter, projectProvider, privilegedProjectProvider, req.ProjectID, nil)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}

		projectOwners, err := common.GetOwnersForProject(ctx, adminUserInfo, kubermaticProject, memberProvider, userProvider)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		clustersNumber, err := getNumberOfClustersForProject(ctx, clusterProviderGetter, seedsGetter, kubermaticProject)
		if err != nil {
			return nil, common.KubernetesErrorToHTTPError(err)
		}
		return common.ConvertInternalProjectToExternal(kubermaticProject, projectOwners, clustersNumber), nil
	}
}

// updateRq defines HTTP request for updateProject
// swagger:parameters updateProject
type updateRq struct {
	common.ProjectReq
	// in: body
	Body apiv1.Project
}

// validate validates updateProject request.
func (r updateRq) validate() error {
	if len(r.ProjectID) == 0 {
		return fmt.Errorf("the id of the project cannot be empty")
	}
	if len(r.Body.Name) == 0 {
		return fmt.Errorf("the name of the project cannot be empty")
	}
	return nil
}

// DecodeUpdateRq decodes an HTTP request into updateRq.
func DecodeUpdateRq(c context.Context, r *http.Request) (interface{}, error) {
	var req updateRq

	pReq, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, err
	}
	req.ProjectReq = pReq.(common.ProjectReq)

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

// projectReq defines HTTP request for createProject endpoint
// swagger:parameters createProject
type projectReq struct {
	// in:body
	Body struct {
		Name   string `json:"name"`
		Spec   apiv1.ProjectSpec
		Labels map[string]string `json:"labels,omitempty"`
		// human user email list for the service account in projectmanagers group
		Users []string `json:"users,omitempty"`
	}
}

// DecodeCreate decodes an HTTP request into projectReq.
func DecodeCreate(c context.Context, r *http.Request) (interface{}, error) {
	var req projectReq

	if err := json.NewDecoder(r.Body).Decode(&req.Body); err != nil {
		return nil, err
	}

	return req, nil
}

// deleteRq defines HTTP request for deleteProject endpoint
// swagger:parameters deleteProject
type deleteRq struct {
	common.ProjectReq
}

// DecodeDelete decodes an HTTP request into deleteRq.
func DecodeDelete(c context.Context, r *http.Request) (interface{}, error) {
	req, err := common.DecodeProjectRequest(c, r)
	if err != nil {
		return nil, nil
	}
	return deleteRq{ProjectReq: req.(common.ProjectReq)}, err
}

// ListReq defines HTTP request for listProjects endpoint
// swagger:parameters listProjects
type ListReq struct {
	// in: query
	DisplayAll bool `json:"displayAll,omitempty"`
}

func DecodeList(c context.Context, r *http.Request) (interface{}, error) {
	var req ListReq
	var displayAll bool
	var err error

	queryParam := r.URL.Query().Get("displayAll")

	if queryParam != "" {
		displayAll, err = strconv.ParseBool(queryParam)
		if err != nil {
			return nil, fmt.Errorf("wrong query parameter: %w", err)
		}
	}
	req.DisplayAll = displayAll

	return req, nil
}

func getNumberOfClustersForProject(ctx context.Context, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter, project *kubermaticv1.Project) (int, error) {
	var clustersNumber int
	seeds, err := seedsGetter()
	if err != nil {
		return clustersNumber, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("failed to list seeds: %v", err))
	}

	for seedName, seed := range seeds {
		if seed.Status.Phase == kubermaticv1.SeedInvalidPhase {
			log.Logger.Warnf("skipping seed %s as it is in an invalid phase", seedName)
			continue
		}

		clusterProvider, err := clusterProviderGetter(seed)
		if err != nil {
			// if one or more Seeds are bad, continue with the request, log that a Seed is in error
			log.Logger.Warnw("error getting cluster provider", "seed", seedName, "error", err)
			continue
		}
		clusters, err := clusterProvider.List(ctx, project, nil)
		if err != nil {
			return clustersNumber, err
		}
		clustersNumber += len(clusters.Items)
	}

	return clustersNumber, nil
}

func getNumberOfClusters(ctx context.Context, clusterProviderGetter provider.ClusterProviderGetter, seedsGetter provider.SeedsGetter) (map[string]int, error) {
	clustersNumber := map[string]int{}
	seeds, err := seedsGetter()
	if err != nil {
		return nil, utilerrors.New(http.StatusInternalServerError, fmt.Sprintf("failed to list seeds: %v", err))
	}

	for seedName, seed := range seeds {
		if seed.Status.Phase == kubermaticv1.SeedInvalidPhase {
			log.Logger.Warnf("skipping seed %s as it is in an invalid phase", seedName)
			continue
		}

		clusterProvider, err := clusterProviderGetter(seed)
		if err != nil {
			// if one or more Seeds are bad, continue with the request, log that a Seed is in error
			log.Logger.Warnw("error getting cluster provider", "seed", seedName, "error", err)
			continue
		}
		clusters, err := clusterProvider.ListAll(ctx, nil)
		if err != nil {
			return clustersNumber, err
		}
		for _, cluster := range clusters.Items {
			projectName, ok := cluster.Labels[kubermaticv1.ProjectIDLabelKey]
			if ok {
				clustersNumber[projectName]++
			}
		}
	}

	return clustersNumber, nil
}
