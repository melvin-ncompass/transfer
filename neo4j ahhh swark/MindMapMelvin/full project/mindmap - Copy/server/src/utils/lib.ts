const errorMessage = (error: any) => {
  return error instanceof Error ? error.message : String(error);
};

const errorStack = (error: any) => {
  return error instanceof Error ? error.stack : String(error);
};

export { errorMessage, errorStack };
