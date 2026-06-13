export const getErrorMessage = (err: any) => {
    return (
      err?.data?.message ||
      err?.error ||
      err?.message ||
      "Something went wrong!"
    );
  };