def pipeline = new io.kubermatic.pipeline()
npmBuildNode(pipeline){

    def goPath = "/go/src/github.com/kubermatic"
    def goImportPath = "/go/src/github.com/kubermatic/dashboard-v2"
    pipeline.setup ("golang", goPath, goImportPath)
    pipeline.setupENV()
    stage('Install deps'){
        container('node') {
           sh("cd ${goImportPath} && make install")
        }
    }
    stage('Build dist'){
        container('node') {
           sh("cd ${goImportPath} && make dist")
        }
    }
/*    stage('Test'){
        container('node') {
           sh("cd ${goImportPath} && make test")
        }
    }
    stage('Test de2e'){
        container('node') {
           sh("cd ${goImportPath} && make e2e")
        }
    }*/
    stage('Build go'){
        container('golang') {
            sh("cd ${goImportPath} && CGO_ENABLED=0 make build")
        }
    }

    if (env.BRANCH_NAME == "develop" && env.GIT_TAG !=  "") {
        pipeline.dockerBuild("docker", "${env.DOCKER_TAG} latest" )
        pipeline.deploy("docker", "prod", "${env.DOCKER_TAG}")
    } else if (env.BRANCH_NAME == "develop") {
        pipeline.dockerBuild("docker", "${env.DOCKER_TAG} develop" )
        pipeline.deploy("docker", "staging", "${env.DOCKER_TAG}")
    } else {
        pipeline.dockerBuild("docker", "${env.DOCKER_TAG} dev" )
        pipeline.deploy("docker", "dev", "${env.DOCKER_TAG}")
    }
}
