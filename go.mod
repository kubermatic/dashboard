module k8c.io/dashboard/v2

go 1.18

require (
	code.cloudfoundry.org/go-pubsub v0.0.0-20220601212219-de495fa84c8e
	github.com/Azure/azure-sdk-for-go v66.0.0+incompatible
	github.com/Azure/azure-sdk-for-go/sdk/azcore v1.1.3
	github.com/Azure/azure-sdk-for-go/sdk/azidentity v1.1.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/authorization/armauthorization v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerservice/armcontainerservice v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/network/armnetwork v1.1.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armresources v1.0.0
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/subscription/armsubscription v1.0.0
	github.com/Azure/go-autorest/autorest v0.11.27 // indirect
	github.com/Azure/go-autorest/autorest/to v0.4.0
	github.com/Masterminds/semver/v3 v3.1.1
	github.com/Masterminds/sprig/v3 v3.2.2 // indirect
	github.com/aliyun/alibaba-cloud-sdk-go v1.61.1768
	github.com/aws/aws-sdk-go-v2 v1.16.14
	github.com/aws/aws-sdk-go-v2/config v1.17.3
	github.com/aws/aws-sdk-go-v2/credentials v1.12.16
	github.com/aws/aws-sdk-go-v2/service/ec2 v1.54.4
	github.com/aws/aws-sdk-go-v2/service/eks v1.21.4
	github.com/aws/aws-sdk-go-v2/service/iam v1.18.17
	github.com/aws/aws-sdk-go-v2/service/sts v1.16.15
	github.com/aws/smithy-go v1.13.2
	github.com/cert-manager/cert-manager v1.9.1
	github.com/coreos/go-oidc v2.2.1+incompatible
	github.com/coreos/locksmith v0.6.2
	github.com/cristim/ec2-instances-info v0.0.0-20220804141719-da3da500d587
	github.com/digitalocean/godo v1.83.0
	github.com/distribution/distribution/v3 v3.0.0-20220907155224-78b9c98c5c31
	github.com/embik/nutanix-client-go v0.1.0
	github.com/evanphx/json-patch v5.6.0+incompatible
	github.com/go-kit/kit v0.12.0
	github.com/go-kit/log v0.2.1
	github.com/go-logr/logr v1.2.3 // indirect
	github.com/go-logr/zapr v1.2.3
	github.com/go-openapi/swag v0.22.3
	github.com/go-test/deep v1.0.8
	github.com/gobuffalo/flect v0.3.0 // indirect
	github.com/google/go-cmp v0.5.9
	github.com/gophercloud/gophercloud v1.0.0
	github.com/gorilla/handlers v1.5.1
	github.com/gorilla/mux v1.8.0
	github.com/gorilla/securecookie v1.1.1
	github.com/gorilla/websocket v1.5.0
	github.com/hetznercloud/hcloud-go v1.35.2
	github.com/imdario/mergo v0.3.13
	github.com/kubermatic/machine-controller v1.55.0
	github.com/minio/minio-go/v7 v7.0.36
	github.com/open-policy-agent/frameworks/constraint v0.0.0-20220504225309-3462b1a344f3 // v0.5.1
	github.com/open-policy-agent/gatekeeper v0.0.0-20220504234711-ecf609290e2e // v3.8.1
	github.com/packethost/packngo v0.26.0
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/prometheus/client_golang v1.13.0
	github.com/robfig/cron/v3 v3.0.1 // indirect
	github.com/sirupsen/logrus v1.9.0 // indirect
	github.com/spf13/cobra v1.5.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/stretchr/testify v1.8.0
	github.com/vmware/go-vcloud-director/v2 v2.16.0
	github.com/vmware/govmomi v0.29.0
	go.anx.io/go-anxcloud v0.4.5
	go.uber.org/zap v1.23.0
	golang.org/x/crypto v0.0.0-20220829220503-c86fa9a7ed90 // indirect
	golang.org/x/oauth2 v0.0.0-20220822191816-0ebed06d0094
	gomodules.xyz/jsonpatch/v2 v2.2.0 // indirect
	google.golang.org/api v0.95.0
	google.golang.org/genproto v0.0.0-20220909194730-69f6226f97e5 // indirect
	google.golang.org/grpc v1.49.0 // indirect
	google.golang.org/protobuf v1.28.1 // indirect
	gopkg.in/square/go-jose.v2 v2.6.0
	gopkg.in/yaml.v3 v3.0.1
	helm.sh/helm/v3 v3.9.4 // indirect
	k8c.io/kubeone v1.5.0
	k8c.io/operating-system-manager v1.1.1
	k8s.io/api v0.25.0
	k8s.io/apiextensions-apiserver v0.25.0
	k8s.io/apimachinery v0.25.0
	k8s.io/apiserver v0.25.0
	k8s.io/autoscaler/vertical-pod-autoscaler v0.11.0 // indirect
	k8s.io/client-go v12.0.0+incompatible
	k8s.io/klog/v2 v2.70.1
	k8s.io/kube-aggregator v0.25.0 // indirect
	k8s.io/kube-openapi v0.0.0-20220803164354-a70c9af30aea // indirect
	k8s.io/kubectl v0.25.0
	k8s.io/metrics v0.25.0
	k8s.io/utils v0.0.0-20220823124924-e9cbc92d1a73
	kubevirt.io/api v0.56.0
	kubevirt.io/containerized-data-importer-api v1.54.0
	sigs.k8s.io/controller-runtime v0.13.0
	sigs.k8s.io/yaml v1.3.0
)

require (
	github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/resources/armsubscriptions v1.0.0
	github.com/go-openapi/errors v0.20.3
	github.com/go-openapi/runtime v0.24.1
	github.com/go-openapi/strfmt v0.21.3
	github.com/go-openapi/validate v0.22.0
	github.com/go-swagger/go-swagger v0.30.1
	github.com/onsi/ginkgo v1.16.5
	k8c.io/kubermatic/v2 v2.21.1-0.20221012091925-abed55b1eab3
	k8s.io/code-generator v0.25.0
	sigs.k8s.io/controller-tools v0.9.2
)

require (
	cloud.google.com/go/compute v1.7.0 // indirect
	github.com/Azure/azure-sdk-for-go/sdk/internal v1.0.0 // indirect
	github.com/Azure/go-autorest v14.2.0+incompatible // indirect
	github.com/Azure/go-autorest/autorest/adal v0.9.20 // indirect
	github.com/Azure/go-autorest/autorest/date v0.3.0 // indirect
	github.com/Azure/go-autorest/autorest/validation v0.3.1 // indirect
	github.com/Azure/go-autorest/logger v0.2.1 // indirect
	github.com/Azure/go-autorest/tracing v0.6.0 // indirect
	github.com/AzureAD/microsoft-authentication-library-for-go v0.5.1 // indirect
	github.com/BurntSushi/toml v1.2.0 // indirect
	github.com/Masterminds/goutils v1.1.1 // indirect
	github.com/ajeddeloh/go-json v0.0.0-20220810161552-7cce03887f34 // indirect
	github.com/ajeddeloh/yaml v0.0.0-20170912190910-6b94386aeefd // indirect
	github.com/alecthomas/units v0.0.0-20211218093645-b94a6e3cc137 // indirect
	github.com/antlr/antlr4/runtime/Go/antlr v0.0.0-20220418222510-f25a4f6275ed // indirect
	github.com/araddon/dateparse v0.0.0-20190622164848-0fb0a474d195 // indirect
	github.com/asaskevich/govalidator v0.0.0-20210307081110-f21760c49a8d // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.12.13 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.1.21 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.4.15 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.3.20 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.9.15 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.11.19 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.13.1 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/blang/semver/v4 v4.0.0 // indirect
	github.com/cespare/xxhash/v2 v2.1.2 // indirect
	github.com/coreos/container-linux-config-transpiler v0.9.0 // indirect
	github.com/coreos/go-semver v0.3.0 // indirect
	github.com/coreos/go-systemd v0.0.0-20191104093116-d3cd4ed1dbcf // indirect
	github.com/coreos/ignition v0.35.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/emicklei/go-restful/v3 v3.9.0 // indirect
	github.com/evanphx/json-patch/v5 v5.6.0 // indirect
	github.com/fatih/color v1.13.0 // indirect
	github.com/felixge/httpsnoop v1.0.3 // indirect
	github.com/fsnotify/fsnotify v1.5.4 // indirect
	github.com/go-logfmt/logfmt v0.5.1 // indirect
	github.com/go-openapi/analysis v0.21.4 // indirect
	github.com/go-openapi/inflect v0.19.0 // indirect
	github.com/go-openapi/jsonpointer v0.19.5 // indirect
	github.com/go-openapi/jsonreference v0.20.0 // indirect
	github.com/go-openapi/loads v0.21.2 // indirect
	github.com/go-openapi/spec v0.20.7 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang-jwt/jwt v3.2.2+incompatible // indirect
	github.com/golang-jwt/jwt/v4 v4.3.0 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/google/cel-go v0.12.4 // indirect
	github.com/google/gnostic v0.6.9 // indirect
	github.com/google/go-querystring v1.1.0 // indirect
	github.com/google/gofuzz v1.2.1-0.20210504230335-f78f29fc09ea // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/googleapis/enterprise-certificate-proxy v0.1.0 // indirect
	github.com/googleapis/gax-go/v2 v2.4.0 // indirect
	github.com/hashicorp/go-version v1.2.0 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/huandu/xstrings v1.3.2 // indirect
	github.com/inconshreveable/mousetrap v1.0.1 // indirect
	github.com/jessevdk/go-flags v1.5.0 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/klauspost/compress v1.15.9 // indirect
	github.com/klauspost/cpuid/v2 v2.1.0 // indirect
	github.com/kr/pretty v0.3.0 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/kylelemons/godebug v1.1.0 // indirect
	github.com/magiconair/properties v1.8.6 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.16 // indirect
	github.com/matttproud/golang_protobuf_extensions v1.0.2-0.20181231171920-c182affec369 // indirect
	github.com/minio/md5-simd v1.1.2 // indirect
	github.com/minio/sha256-simd v1.0.0 // indirect
	github.com/mitchellh/copystructure v1.2.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/mitchellh/reflectwalk v1.0.2 // indirect
	github.com/moby/spdystream v0.2.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/nxadm/tail v1.4.8 // indirect
	github.com/oklog/ulid v1.3.1 // indirect
	github.com/onsi/ginkgo/v2 v2.1.6 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/openshift/api v0.0.0-20211217221424-8779abfbd571 // indirect
	github.com/openshift/custom-resource-status v1.1.2 // indirect
	github.com/opentracing/opentracing-go v1.2.0 // indirect
	github.com/pborman/uuid v1.2.1 // indirect
	github.com/pelletier/go-toml v1.9.5 // indirect
	github.com/pelletier/go-toml/v2 v2.0.1 // indirect
	github.com/peterhellberg/link v1.1.0 // indirect
	github.com/pkg/browser v0.0.0-20210115035449-ce105d075bb4 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/pquerna/cachecontrol v0.1.0 // indirect
	github.com/prometheus/client_model v0.2.1-0.20210607210712-147c58e9608a // indirect
	github.com/prometheus/common v0.37.0 // indirect
	github.com/prometheus/procfs v0.8.0 // indirect
	github.com/rogpeppe/go-internal v1.9.0 // indirect
	github.com/rs/xid v1.4.0 // indirect
	github.com/shopspring/decimal v1.3.1 // indirect
	github.com/spf13/afero v1.8.2 // indirect
	github.com/spf13/cast v1.5.0 // indirect
	github.com/spf13/jwalterweatherman v1.1.0 // indirect
	github.com/spf13/viper v1.12.0 // indirect
	github.com/stoewer/go-strcase v1.2.0 // indirect
	github.com/subosito/gotenv v1.3.0 // indirect
	github.com/toqueteos/webbrowser v1.2.0 // indirect
	github.com/vincent-petithory/dataurl v1.0.0 // indirect
	go.mongodb.org/mongo-driver v1.10.1 // indirect
	go.opencensus.io v0.23.0 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	go.uber.org/multierr v1.8.0 // indirect
	go4.org v0.0.0-20201209231011-d4a079459e60 // indirect
	golang.org/x/mod v0.6.0-dev.0.20220419223038-86c51ed26bb4 // indirect
	golang.org/x/net v0.0.0-20220826154423-83b083e8dc8b // indirect
	golang.org/x/sys v0.0.0-20220829200755-d48e67d00261 // indirect
	golang.org/x/term v0.0.0-20220722155259-a9ba230a4035 // indirect
	golang.org/x/text v0.3.7 // indirect
	golang.org/x/time v0.0.0-20220722155302-e5dcc9cfc0b9 // indirect
	golang.org/x/tools v0.1.12 // indirect
	google.golang.org/appengine v1.6.7 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/ini.v1 v1.66.6 // indirect
	gopkg.in/tomb.v1 v1.0.0-20141024135613-dd632973f1e7 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	k8s.io/component-base v0.25.0 // indirect
	k8s.io/gengo v0.0.0-20220613173612-397b4ae3bce7 // indirect
	k8s.io/klog v1.0.0 // indirect
	k8s.io/kubelet v0.25.0 // indirect
	kubevirt.io/controller-lifecycle-operator-sdk/api v0.0.0-20220329064328-f3cc58c6ed90 // indirect
	sigs.k8s.io/gateway-api v0.4.3 // indirect
	sigs.k8s.io/json v0.0.0-20220713155537-f223a00ba0e2 // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.2.3 // indirect
)

replace (
	k8s.io/api => k8s.io/api v0.25.0
	k8s.io/apiextensions-apiserver => k8s.io/apiextensions-apiserver v0.25.0
	k8s.io/apimachinery => k8s.io/apimachinery v0.25.0
	k8s.io/client-go => k8s.io/client-go v0.25.0
	k8s.io/cluster-bootstrap => k8s.io/cluster-bootstrap v0.25.0
	k8s.io/code-generator => k8s.io/code-generator v0.25.0
	k8s.io/kube-aggregator => k8s.io/kube-aggregator v0.25.0
	k8s.io/kubectl => k8s.io/kubectl v0.25.0
	k8s.io/kubelet => k8s.io/kubelet v0.25.0
	k8s.io/metrics => k8s.io/metrics v0.25.0
)

replace github.com/ajeddeloh/go-json => github.com/coreos/go-json v0.0.0-20220810161552-7cce03887f34

// overrides required for OPA constraints
replace (
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc => go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.20.0
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp => go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.20.0
	go.opentelemetry.io/otel => go.opentelemetry.io/otel v0.20.0
	go.opentelemetry.io/otel/metric => go.opentelemetry.io/otel/metric v0.20.0
	go.opentelemetry.io/otel/sdk => go.opentelemetry.io/otel/sdk v0.20.0
	go.opentelemetry.io/otel/trace => go.opentelemetry.io/otel/trace v0.20.0
	go.opentelemetry.io/proto/otlp => go.opentelemetry.io/proto/otlp v0.7.0
)
