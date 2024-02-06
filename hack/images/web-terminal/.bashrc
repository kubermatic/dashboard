# default editor
export EDITOR=vim

### kubectl autocompletion
source <(kubectl completion bash)
alias k=kubectl
complete -F __start_kubectl k

### helm
source <(helm completion bash)

##### fubectl
[ -f $HOME/bin/fubectl.source ] && source $HOME/bin/fubectl.source

# fzf
[ -f ~/.fzf.bash ] && source ~/.fzf.bash

#### krew
export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"

