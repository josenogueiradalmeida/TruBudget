import strings from "../../localizeStrings";
import { formatString } from "../../helper";

export const intentMapping = ({ originalEvent, resources }) => {
  switch (originalEvent.intent) {
    case "subproject.assign": {
      const subproject = resources.find(resource => resource.type === "subproject");
      const resourceName = subproject.displayName || "";
      const text = formatString(strings.notification.subproject_assign, resourceName);
      return `${text} ${resourceName ? "" : strings.notification.no_permissions}`;
    }
    case "workflowitem.assign": {
      const workflowitem = resources.find(resource => resource.type === "workflowitem");
      const resourceName = workflowitem.displayName || "";
      const text = formatString(strings.notification.workflowitem_assign, resourceName);
      return `${text} ${resourceName ? "" : strings.notification.no_permissions}`;
    }
    case "project.assign": {
      const project = resources.find(resource => resource.type === "project");
      const resourceName = project.displayName || "";
      const text = formatString(strings.notification.project_assign, resourceName);
      return `${text} ${resourceName ? "" : strings.notification.no_permissions}`;
    }
    case "workflowitem.close": {
      const workflowitem = resources.find(resource => resource.type === "workflowitem");
      const resourceName = workflowitem.displayName || "";
      const text = formatString(strings.notification.workflowitem_close, resourceName);
      return `${text} ${resourceName ? "" : strings.notification.no_permissions}`;
    }
    case "subproject.close": {
      const workflowitem = resources.find(resource => resource.type === "subproject");
      const resourceName = workflowitem.displayName || "";
      const text = formatString(strings.notification.subproject_close, resourceName);
      return `${text} ${resourceName ? "" : strings.notification.no_permissions}`;
    }
    default:
      return "Intent not found";
  }
};

export const parseURI = ({ resources }) => {
  const project = resources.find(resource => resource.type === "project");
  const subproject = resources.find(resource => resource.type === "subproject");
  if (subproject) {
    return `/projects/${project.id}/${subproject.id}`;
  } else {
    return `/projects/${project.id}`;
  }
};

export const fetchRessourceName = (res, type) => {
  const r = res.find(v => v.type === type);
  if (r !== undefined) {
    return r.displayName || strings.workflow.workflow_redacted;
  } else {
    return "-";
  }
};

export const hasAccess = res => res.reduce((acc, r) => acc && r.displayName !== undefined, true);
