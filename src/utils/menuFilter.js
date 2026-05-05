import { getRoleId } from "./auth";

export const filterMenuByRole = (menu, roleIdParam) => {
  const roleId = roleIdParam !== undefined ? roleIdParam : getRoleId();

  const filterItems = (items) => {
    return items
      .map((item) => {
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        }
        return !item.roles || item.roles.includes(roleId) ? item : null;
      })
      .filter(Boolean);
  };

  return filterItems(menu);
};
