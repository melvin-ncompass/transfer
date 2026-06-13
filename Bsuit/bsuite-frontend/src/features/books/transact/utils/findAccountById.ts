export const findAccountById = (
  accountGroups: {
    label: string;
    options: {
      label: string;
      value: string;
      currency: any;
    }[];
  }[],
  id: string
) => {
  for (const group of accountGroups) {
    const account = group.options.find((opt) => opt.value === id);
    if (account) {
      return account;
    }
  }
  return null;
};
