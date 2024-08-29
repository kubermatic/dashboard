module k8c.io/dashboard/v2

go 1.22.4

toolchain go1.22.5

require (
	code.cloudfoundry.org/go-pubsub v0.0.0-20231211165245-0e22ad1266d6
	github.com/Azure/azure-sdk-for-go v68.0.0+incompatible
	github.com/Azure/azure-sdk-for-go/sdk/azcore v1.12.0
	github.com/Azure/azure-sdk-for-go/sdk/azidentity v1.7.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/authorization/armauthorization v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerservice/armcontainerservice v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/network/armnetwork v1.1.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armresources v1.2.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions v1.3.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/subscription/armsubscription v1.2.0
	github.com/Azure/go-autorest/autorest/to v0.4.0
	github.com/Masterminds/semver/v3 v3.2.1
	github.com/aliyun/alibaba-cloud-sdk-go v1.62.784
	github.com/aws/aws-sdk-go-v2 v1.30.1
	github.com/aws/aws-sdk-go-v2/config v1.27.24
	github.com/aws/aws-sdk-go-v2/credentials v1.17.24
	github.com/aws/aws-sdk-go-v2/service/ec2 v1.168.0
	github.com/aws/aws-sdk-go-v2/service/eks v1.44.1
	github.com/aws/aws-sdk-go-v2/service/iam v1.33.1
	github.com/aws/aws-sdk-go-v2/service/sts v1.30.1
	github.com/aws/smithy-go v1.20.3
	github.com/coreos/go-oidc v2.2.1+incompatible
	github.com/cristim/ec2-instances-info v0.0.0-20221130144415-da4474e2a3d1
	github.com/digitalocean/godo v1.118.0
	github.com/embik/nutanix-client-go v0.1.0
	github.com/evanphx/json-patch v5.9.0+incompatible
	github.com/go-jose/go-jose/v4 v4.0.2
	github.com/go-kit/kit v0.13.0
	github.com/go-kit/log v0.2.1
	github.com/go-logr/zapr v1.3.0
	github.com/go-openapi/errors v0.21.0
	github.com/go-openapi/runtime v0.27.1
	github.com/go-openapi/strfmt v0.22.0
	github.com/go-openapi/swag v0.23.0
	github.com/go-openapi/validate v0.23.0
	github.com/go-swagger/go-swagger v0.30.3
	github.com/go-test/deep v1.1.1
	github.com/google/go-cmp v0.6.0
	github.com/gophercloud/gophercloud v1.12.0
	github.com/gorilla/handlers v1.5.2
	github.com/gorilla/mux v1.8.1
	github.com/gorilla/securecookie v1.1.2
	github.com/gorilla/websocket v1.5.1
	github.com/hetznercloud/hcloud-go v1.57.0
	github.com/kubermatic/machine-controller v1.59.1-0.20240826111717-3ead298cdda9
	github.com/minio/minio-go/v7 v7.0.69
	github.com/onsi/ginkgo v1.16.5
	github.com/open-policy-agent/frameworks/constraint v0.0.0-20240206175643-9de2e6ab07f8 // v0.9.0+
	github.com/open-policy-agent/gatekeeper/v3 v3.15.1
	github.com/packethost/packngo v0.31.0
	github.com/pkg/errors v0.9.1
	github.com/prometheus/client_golang v1.20.1
	github.com/spf13/cobra v1.8.1
	github.com/spf13/pflag v1.0.6-0.20210604193023-d5e0c0615ace
	github.com/stretchr/testify v1.9.0
	github.com/vmware-tanzu/velero v1.14.0
	github.com/vmware/go-vcloud-director/v2 v2.25.0
	github.com/vmware/govmomi v0.42.0
	go.anx.io/go-anxcloud v0.7.2
	go.uber.org/zap v1.27.0
	golang.org/x/oauth2 v0.22.0
	google.golang.org/api v0.187.0
	gopkg.in/yaml.v3 v3.0.1
	k8c.io/kubeone v1.7.3
	k8c.io/kubermatic/v2 v2.25.1-0.20240828091320-045f90ef8db4
	k8c.io/operating-system-manager v1.5.1-0.20240822183214-db378951daf3
	k8c.io/reconciler v0.5.0
	k8s.io/api v0.31.0
	k8s.io/apiextensions-apiserver v0.31.0
	k8s.io/apimachinery v0.31.0
	k8s.io/apiserver v0.31.0
	k8s.io/client-go v0.31.0
	k8s.io/code-generator v0.31.0
	k8s.io/klog/v2 v2.130.1
	k8s.io/kubectl v0.31.0
	k8s.io/metrics v0.31.0
	k8s.io/utils v0.0.0-20240821151609-f90d01438635
	kubevirt.io/api v1.2.2
	kubevirt.io/containerized-data-importer-api v1.59.0
	sigs.k8s.io/controller-runtime v0.19.0
	sigs.k8s.io/controller-tools v0.14.0
	sigs.k8s.io/yaml v1.4.0
)

// Temporarily pinning k8s.io dependencies to v0.30.0
// TODO: Remove this when https://github.com/kubermatic/kubermatic/pull/13593 and https://github.com/kubermatic/kubermatic/pull/13621 are merged.
replace (
	k8s.io/api => k8s.io/api v0.30.3
	k8s.io/apiextensions-apiserver => k8s.io/apiextensions-apiserver v0.30.3
	k8s.io/apimachinery => k8s.io/apimachinery v0.30.3
	k8s.io/apiserver => k8s.io/apiserver v0.30.3
	k8s.io/client-go => k8s.io/client-go v0.30.3
	k8s.io/code-generator => k8s.io/code-generator v0.30.3
	k8s.io/component-base => k8s.io/component-base v0.30.3
	k8s.io/kubectl => k8s.io/kubectl v0.30.3
	k8s.io/metrics => k8s.io/metrics v0.30.3
	k8s.io/utils => k8s.io/utils v0.0.0-20240711033017-18e509b52bc8
	sigs.k8s.io/controller-runtime => sigs.k8s.io/controller-runtime v0.18.2
)

replace github.com/ajeddeloh/go-json => github.com/coreos/go-json v0.0.0-20220810161552-7cce03887f34

require (
	cloud.google.com/go/auth v0.6.1 // indirect
	cloud.google.com/go/auth/oauth2adapt v0.2.2 // indirect
	cloud.google.com/go/compute/metadata v0.4.0 // indirect
	dario.cat/mergo v1.0.0 // indirect
	github.com/AdaLogics/go-fuzz-headers v0.0.0-20230811130428-ced1acdcaa24 // indirect
	github.com/Azure/azure-sdk-for-go/sdk/internal v1.9.0 // indirect
	github.com/Azure/go-autorest v14.2.0+incompatible // indirect
	github.com/Azure/go-autorest/autorest v0.11.29 // indirect
	github.com/Azure/go-autorest/autorest/adal v0.9.24 // indirect
	github.com/Azure/go-autorest/autorest/date v0.3.0 // indirect
	github.com/Azure/go-autorest/autorest/validation v0.3.1 // indirect
	github.com/Azure/go-autorest/logger v0.2.1 // indirect
	github.com/Azure/go-autorest/tracing v0.6.0 // indirect
	github.com/AzureAD/microsoft-authentication-library-for-go v1.2.2 // indirect
	github.com/BurntSushi/toml v1.4.0 // indirect
	github.com/Masterminds/goutils v1.1.1 // indirect
	github.com/Masterminds/sprig/v3 v3.2.3 // indirect
	github.com/PaesslerAG/gval v1.2.2 // indirect
	github.com/PaesslerAG/jsonpath v0.1.1 // indirect
	github.com/antlr/antlr4/runtime/Go/antlr/v4 v4.0.0-20230305170008-8188dc5388df // indirect
	github.com/araddon/dateparse v0.0.0-20210429162001-6b43995a97de // indirect
	github.com/asaskevich/govalidator v0.0.0-20230301143203-a9d515a09cc2 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.16.9 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.3.13 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.6.13 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.8.0 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.11.3 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.11.15 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.22.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.26.2 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/blang/semver/v4 v4.0.0 // indirect
	github.com/cert-manager/cert-manager v1.14.4 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/containerd/containerd v1.7.20 // indirect
	github.com/containerd/errdefs v0.1.0 // indirect
	github.com/containerd/log v0.1.0 // indirect
	github.com/containerd/platforms v0.2.1 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/distribution/reference v0.6.0 // indirect
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/emicklei/go-restful/v3 v3.12.1 // indirect
	github.com/evanphx/json-patch/v5 v5.9.0 // indirect
	github.com/fatih/color v1.16.0 // indirect
	github.com/felixge/httpsnoop v1.0.4 // indirect
	github.com/fsnotify/fsnotify v1.7.0 // indirect
	github.com/go-logfmt/logfmt v0.6.0 // indirect
	github.com/go-logr/logr v1.4.2 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-openapi/analysis v0.22.2 // indirect
	github.com/go-openapi/inflect v0.19.0 // indirect
	github.com/go-openapi/jsonpointer v0.21.0 // indirect
	github.com/go-openapi/jsonreference v0.21.0 // indirect
	github.com/go-openapi/loads v0.21.5 // indirect
	github.com/go-openapi/spec v0.20.14 // indirect
	github.com/gobuffalo/flect v1.0.2 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang-jwt/jwt/v4 v4.5.0 // indirect
	github.com/golang-jwt/jwt/v5 v5.2.1 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/protobuf v1.5.4 // indirect
	github.com/google/cel-go v0.17.8 // indirect
	github.com/google/gnostic-models v0.6.8 // indirect
	github.com/google/go-querystring v1.1.0 // indirect
	github.com/google/gofuzz v1.2.1-0.20210504230335-f78f29fc09ea // indirect
	github.com/google/s2a-go v0.1.7 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.3.2 // indirect
	github.com/googleapis/gax-go/v2 v2.12.5 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/go-retryablehttp v0.7.7 // indirect
	github.com/hashicorp/go-version v1.7.0 // indirect
	github.com/hashicorp/hcl v1.0.1-vault-5 // indirect
	github.com/huandu/xstrings v1.5.0 // indirect
	github.com/imdario/mergo v0.3.16 // indirect
	github.com/inconshreveable/mousetrap v1.1.0 // indirect
	github.com/jessevdk/go-flags v1.5.0 // indirect
	github.com/jmespath/go-jmespath v0.4.1-0.20220621161143-b0104c826a24 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/compress v1.17.9 // indirect
	github.com/klauspost/cpuid/v2 v2.2.6 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/kubernetes-csi/external-snapshotter/client/v7 v7.0.0 // indirect
	github.com/kylelemons/godebug v1.1.0 // indirect
	github.com/magiconair/properties v1.8.7 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/minio/md5-simd v1.1.2 // indirect
	github.com/minio/sha256-simd v1.0.1 // indirect
	github.com/mitchellh/copystructure v1.2.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/mitchellh/reflectwalk v1.0.2 // indirect
	github.com/moby/locker v1.0.1 // indirect
	github.com/moby/spdystream v0.4.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/mxk/go-flowrate v0.0.0-20140419014527-cca7078d478f // indirect
	github.com/nutanix-cloud-native/prism-go-client v0.4.0 // indirect
	github.com/nxadm/tail v1.4.11 // indirect
	github.com/oklog/ulid v1.3.1 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/opencontainers/image-spec v1.1.0 // indirect
	github.com/openshift/api v0.0.0-20240708071937-c9a91940bf0f // indirect
	github.com/openshift/custom-resource-status v1.1.2 // indirect
	github.com/opentracing/opentracing-go v1.2.1-0.20220228012449-10b1cf09e00b // indirect
	github.com/pborman/uuid v1.2.1 // indirect
	github.com/pelletier/go-toml/v2 v2.1.0 // indirect
	github.com/peterhellberg/link v1.2.0 // indirect
	github.com/pkg/browser v0.0.0-20240102092130-5ac0b6a4141c // indirect
	github.com/pmezard/go-difflib v1.0.1-0.20181226105442-5d4384ee4fb2 // indirect
	github.com/pquerna/cachecontrol v0.2.0 // indirect
	github.com/prometheus/client_model v0.6.1 // indirect
	github.com/prometheus/common v0.55.0 // indirect
	github.com/prometheus/procfs v0.15.1 // indirect
	github.com/robfig/cron/v3 v3.0.1 // indirect
	github.com/rogpeppe/go-internal v1.12.0 // indirect
	github.com/rs/xid v1.5.0 // indirect
	github.com/sagikazarmark/locafero v0.4.0 // indirect
	github.com/sagikazarmark/slog-shim v0.1.0 // indirect
	github.com/shopspring/decimal v1.4.0 // indirect
	github.com/sirupsen/logrus v1.9.3 // indirect
	github.com/sourcegraph/conc v0.3.0 // indirect
	github.com/spf13/afero v1.11.0 // indirect
	github.com/spf13/cast v1.7.0 // indirect
	github.com/spf13/viper v1.18.2 // indirect
	github.com/stoewer/go-strcase v1.3.0 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	github.com/tinkerbell/tink v0.10.0 // indirect
	github.com/toqueteos/webbrowser v1.2.0 // indirect
	go.mongodb.org/mongo-driver v1.13.1 // indirect
	go.opencensus.io v0.24.0 // indirect
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.53.0 // indirect
	go.opentelemetry.io/otel v1.28.0 // indirect
	go.opentelemetry.io/otel/metric v1.28.0 // indirect
	go.opentelemetry.io/otel/trace v1.28.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	golang.org/x/crypto v0.26.0 // indirect
	golang.org/x/exp v0.0.0-20240808152545-0cdaa3abc0fa // indirect
	golang.org/x/mod v0.20.0 // indirect
	golang.org/x/net v0.28.0 // indirect
	golang.org/x/sync v0.8.0 // indirect
	golang.org/x/sys v0.24.0 // indirect
	golang.org/x/term v0.23.0 // indirect
	golang.org/x/text v0.17.0 // indirect
	golang.org/x/time v0.6.0 // indirect
	golang.org/x/tools v0.24.0 // indirect
	gomodules.xyz/jsonpatch/v2 v2.4.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20240701130421-f6361c86f094 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240701130421-f6361c86f094 // indirect
	google.golang.org/grpc v1.65.0 // indirect
	google.golang.org/protobuf v1.34.2 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/ini.v1 v1.67.0 // indirect
	gopkg.in/square/go-jose.v2 v2.6.0 // indirect
	gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	helm.sh/helm/v3 v3.14.3 // indirect
	k8s.io/autoscaler/vertical-pod-autoscaler v1.0.0 // indirect
	k8s.io/component-base v0.31.0 // indirect
	k8s.io/gengo/v2 v2.0.0-20240812201722-3b05ca7b6e59 // indirect
	k8s.io/klog v1.0.0 // indirect
	k8s.io/kube-aggregator v0.30.0 // indirect
	k8s.io/kube-openapi v0.0.0-20240816214639-573285566f34 // indirect
	kubevirt.io/controller-lifecycle-operator-sdk/api v0.2.4 // indirect
	sigs.k8s.io/gateway-api v1.0.1-0.20240305045206-346e951245f2 // indirect
	sigs.k8s.io/json v0.0.0-20221116044647-bc3834ca7abd // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.4.1 // indirect
)
