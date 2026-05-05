import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getToken } from "../../utils/auth";
import {
  Modal,
  Checkbox,
  Row,
  Col,
  Typography,
  Collapse,
  Select,
  Button,
  Space,
  Tag,
  message,
} from "antd";

const { Text } = Typography;
const { Panel } = Collapse;

const BASE = import.meta.env.VITE_API_URL;

function RolePermissionModal({ open, onCancel, onSave, role }) {
  const [departments, setDepartments] = useState([]);
  const [activeDept, setActiveDept] = useState(null);
  const [permissions, setPermissions] = useState({});

  // ================= LOAD DATA =================
  const loadPermissions = useCallback(async () => {
    try {
      // 🔹 ALL ACTIONS
      const resAll = await fetch(
        `${BASE}/api/users/me/group-by-department`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "user-id": 1,
          },
        }
      );
      const allData = await resAll.json();

      // 🔹 ROLE ACTIONS
      const resRole = await fetch(
        `${BASE}/api/roles/${role.id}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      const roleData = await resRole.json();

      const roleActionIds = new Set();

      roleData.permissions?.forEach((dept) => {
        dept.modules.forEach((mod) => {
          mod.actions.forEach((a) => {
            roleActionIds.add(a.id);
          });
        });
      });

      setDepartments(allData);

      const formatted = {};

      allData.forEach((dept) => {
        formatted[dept.department_id] = {};

        dept.modules.forEach((mod) => {
          const actionMap = {};
          const actionList = [];

          mod.actions?.forEach((a) => {
            actionMap[a.name] = a.id;
            actionList.push(a.name);
          });

          formatted[dept.department_id][mod.module_id] = {
            __actionIds: actionMap,
            __actions: actionList,
          };

          actionList.forEach((name) => {
            const id = actionMap[name];
            formatted[dept.department_id][mod.module_id][name] =
              roleActionIds.has(id); // ✅ preselect
          });
        });
      });

      setPermissions(formatted);

      if (allData.length > 0) {
        setActiveDept(allData[0].department_id);
      }
    } catch {
      message.error("Failed to load permissions ❌");
    }
  }, [role]);

  useEffect(() => {
    if (open && role) loadPermissions();
  }, [open, role, loadPermissions]);

  const currentDept = useMemo(
    () => departments.find((d) => d.department_id === activeDept),
    [departments, activeDept]
  );

  // ================= CHANGE =================
  const handleChange = (deptId, moduleId, action, checked) => {
    setPermissions((prev) => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        [moduleId]: {
          ...prev[deptId][moduleId],
          [action]: checked,
        },
      },
    }));
  };

  // ================= TOGGLE MODULE =================
  const toggleModule = (deptId, moduleId) => {
    const modulePerms = permissions[deptId][moduleId];
    const actions = modulePerms.__actions;

    const allSelected = actions.every((a) => modulePerms[a]);

    const updated = { ...permissions };

    actions.forEach((a) => {
      updated[deptId][moduleId][a] = !allSelected;
    });

    setPermissions(updated);
  };

  // ================= TOGGLE DEPARTMENT =================
  const toggleDepartment = () => {
    const updated = { ...permissions };

    currentDept.modules.forEach((mod) => {
      const modulePerms = updated[activeDept][mod.module_id];
      const actions = modulePerms.__actions;

      const allSelected = actions.every((a) => modulePerms[a]);

      actions.forEach((a) => {
        modulePerms[a] = !allSelected;
      });
    });

    setPermissions(updated);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={() => onSave(permissions)}
      width={950}
      title={`Permissions - ${role?.role_name}`}
    >
      {/* HEADER */}
      <Row justify="space-between" style={{ marginBottom: 20 }}>
        <Select
          value={activeDept}
          onChange={setActiveDept}
          style={{ width: 260 }}
        >
          {departments.map((d) => (
            <Select.Option
              key={d.department_id}
              value={d.department_id}
            >
              {d.department_name}
            </Select.Option>
          ))}
        </Select>

        <Button onClick={toggleDepartment}>Toggle All</Button>
      </Row>

      <Collapse accordion>
        {currentDept?.modules?.map((module) => {
          const modulePerms =
            permissions?.[activeDept]?.[module.module_id] || {};

          const actions = modulePerms.__actions || [];

          const selectedCount = actions.filter(
            (a) => modulePerms[a]
          ).length;

          return (
            <Panel
              key={module.module_id}
              header={
                <Space>
                  <Text strong>{module.module_name}</Text>

                  <Tag color="blue">
                    {selectedCount}/{actions.length}
                  </Tag>

                  {selectedCount === actions.length &&
                    actions.length > 0 && (
                      <Tag color="green">Full Access</Tag>
                    )}

                  {actions.length === 0 && (
                    <Tag color="red">No Access</Tag>
                  )}
                </Space>
              }
              extra={
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModule(activeDept, module.module_id);
                  }}
                >
                  Toggle
                </Button>
              }
            >
              <Row gutter={[12, 12]}>
                {actions.map((action) => (
                  <Col span={6} key={action}>
                    <Checkbox
                      checked={modulePerms[action]}
                      onChange={(e) =>
                        handleChange(
                          activeDept,
                          module.module_id,
                          action,
                          e.target.checked
                        )
                      }
                    >
                      {action.toUpperCase()}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Panel>
          );
        })}
      </Collapse>
    </Modal>
  );
}

export default RolePermissionModal;