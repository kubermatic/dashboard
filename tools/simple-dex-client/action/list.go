package action

type listAction struct{}

func (listAction) Type() ActionType {
	return List
}

func (listAction) Validate() error {
	return nil
}

func newListAction() Action {
	return &listAction{}
}
