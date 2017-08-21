def pipeline = new io.kubermatic.pipeline()
npmBuildNode(pipeline){

    def goPath = "/go/src/github.com/kubermatic"
    def goImportPath = "/go/src/github.com/kubermatic/dashboard-v2"
    pipeline.setup ("golang", goPath, goImportPath)
    pipeline.setupENV()
    stage('Install deps'){
        container('node') {
           sh("make install")
        }
    }
    stage('Build dist'){
        container('node') {
           sh("make dist")
        }
    }
/* stage('Test'){
        container('node') {
           sh("make test")
        }
    }
    stage('Test de2e'){
        container('node') {
           sh("make e2e")
        }
    } */
    stage('Build go'){
        container('golang') {
            sh("cd ${goImportPath} && CGO_ENABLED=0 make build")
        }
    }

    if (env.BRANCH_NAME == "master" && env.GIT_TAG !=  "") {
        pipeline.dockerBuild("docker", "${env.DOCKER_TAG} latest", "./")
        pipeline.deploy("docker", "prod", "kubermatic", "deployment/kubermatic-ui-v2", "webserver=kubermatic/ui-v2:${env.DOCKER_TAG}")
    } else if (env.BRANCH_NAME == "master") {
        pipeline.dockerBuild("docker", "${env.DOCKER_TAG} develop", "./")
        pipeline.deploy("docker", "dev", "kubermatic", "deployment/kubermatic-ui-v2", "webserver=kubermatic/ui-v2:${env.DOCKER_TAG}")
        pipeline.deploy("docker", "staging", "kubermatic", "deployment/kubermatic-ui-v2", "webserver=kubermatic/ui-v2:${env.DOCKER_TAG}")
    } else {
        pipeline.dockerBuild("docker", "${env.DOCKER_TAG}", "./")
        pipeline.deploy("docker", "dev", "kubermatic", "deployment/kubermatic-ui-v2", "webserver=kubermatic/ui-v2:${env.DOCKER_TAG}")
    }
}
