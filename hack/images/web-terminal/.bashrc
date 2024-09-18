# default editor
export EDITOR=vim

### kubectl autocompletion
source <(kubectl completion bash)
alias k=kubectl
complete -F __start_kubectl k

### helm
# prevent 'Warning kubectl file is {world,group}-readable'
chmod 600 ${KUBECONFIG}
source <(helm completion bash)

##### fubectl
[ -f $HOME/bin/fubectl.source ] && source $HOME/bin/fubectl.source

# fzf
[ -f ~/.fzf.bash ] && source ~/.fzf.bash

#### krew
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"

