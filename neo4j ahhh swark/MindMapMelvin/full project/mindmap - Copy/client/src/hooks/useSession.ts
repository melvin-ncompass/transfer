const useSessionStorage = () => {
  const getSessionStorage = (key: string) => {
    return sessionStorage.getItem(key);
  };

  const setSessionStorage = (key: string, value: string) => {
    sessionStorage.setItem(key, value);
  };

  const removeSessionStorage = (key: string) => {
    sessionStorage.removeItem(key);
  };

  const clearSessionStorage = () => {
    sessionStorage.clear();
  };

  const sessionUser = () => {
    return getSessionStorage("username");
  };
  const sessionToken = () => {
    return getSessionStorage("access_token");
  };
  const sessionRepo = () => {
    return getSessionStorage("selected_repo");
  };
  const sessionBranch = () => {
    return getSessionStorage("selected_branch");
  };
  const sessionCommit = () => {
    return getSessionStorage("selected_commit");
  };

  return {
    getSessionStorage,
    setSessionStorage,
    removeSessionStorage,
    clearSessionStorage,
    sessionUser,
    sessionToken,
    sessionRepo,
    sessionBranch,
    sessionCommit,
  };
};

export default useSessionStorage;
