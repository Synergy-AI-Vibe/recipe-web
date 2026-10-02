export type LoginDialogState = {
  openRequest: number;
};

export type LoginDialogActions = {
  requestOpen: () => void;
};

export type LoginDialogStore = LoginDialogState & LoginDialogActions;
