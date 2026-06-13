const getModuleColor = (module: string) => {
  const colors = {
    auth: "#e74c3c",
    user: "#3498db",
    api: "#2ecc71",
    utils: "#f39c12",
    controller: "#9b59b6",
    service: "#1abc9c",
    unknown: "#95a5a6",
  };
  return colors[module as keyof typeof colors] || colors.unknown;
};

export { getModuleColor };
