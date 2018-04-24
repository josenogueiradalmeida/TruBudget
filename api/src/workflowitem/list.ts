import * as express from "express";
import { AuthToken } from "../authz/token";
import {
  HttpResponse,
  throwParseError,
  throwParseErrorIfUndefined,
  AuthenticatedRequest
} from "../httpd/lib";
import { MultichainClient, SubprojectOnChain } from "../multichain";
import { SubprojectUserView } from "../multichain/resources/subproject";
import { isNonemptyString } from "../lib";
import * as Workflowitem from "./index";
import { WorkflowitemUserView, getAllForUser } from "./index";

const value = (name, val, isValid?) => {
  if (isValid !== undefined && !isValid(val)) {
    throwParseError([name]);
  }
  return val;
};

export const getWorkflowitemList = async (
  multichain: MultichainClient,
  req: AuthenticatedRequest
): Promise<HttpResponse> => {
  return [
    200,
    {
      apiVersion: "1.0",
      data: await list(
        multichain,
        req.token,
        value("projectId", req.query.projectId, isNonemptyString),
        value("subprojectId", req.query.subprojectId, isNonemptyString)
      )
    }
  ];
};

const list = async (
  multichain: MultichainClient,
  token: AuthToken,
  projectId: string,
  subprojectId: string
): Promise<WorkflowitemUserView[]> => {
  const workflowitems: WorkflowitemUserView[] = await getAllForUser(
    multichain,
    token,
    projectId,
    subprojectId
  );

  const clearedWorkflowitems = workflowitems.filter(workflowitem =>
    workflowitem.allowedIntents.includes("workflowitem.viewSummary")
  );

  return clearedWorkflowitems;
};