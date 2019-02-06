import { getAllowedIntents } from "../authz";
import Intent from "../authz/intents";
import { isEmpty } from "../lib/emptyChecks";
import { inheritDefinedProperties } from "../lib/inheritDefinedProperties";
import { userIdentities } from "../project";
import { User } from "./User";
import { getWorkflowitemList } from "../HttpdMultichainAdapter";
import {
  hashDocuments,
  isUserAllowedTo,
  isWorkflowitemClosable,
  redactHistoryEvent,
  removeEventLog,
  ScrubbedWorkflowitem,
  scrubWorkflowitem,
  sortWorkflowitems,
  Update,
  validateWorkflowitem,
  Workflowitem,
} from "./Workflowitem";

export * from "./Workflowitem";
export * from "./User";

export type Closer = (workflowitemId: string) => Promise<void>;
export type CloseNotifier = (workflowitem: Workflowitem, actingUser: User) => Promise<void>;

export type ListReader = () => Promise<Workflowitem[]>;
export type OrderingReader = () => Promise<string[]>;

export type Updater = (workflowitemId: string, data: Update) => Promise<void>;
export type UpdateNotifier = (workflowitem: Workflowitem, updatedData: Update) => Promise<void>;

export async function getAllScrubbedItems(
  asUser: User,
  {
    getAllWorkflowitems,
    getWorkflowitemOrdering,
  }: { getAllWorkflowitems: ListReader; getWorkflowitemOrdering: OrderingReader },
): Promise<ScrubbedWorkflowitem[]> {
  const workflowitemOrdering = await getWorkflowitemOrdering();
  const workflowitems = await getAllWorkflowitems();
  const sortedWorkflowitems = sortWorkflowitems(workflowitems, workflowitemOrdering);
  const scrubbedWorkflowitems = await sortedWorkflowitems.map(workflowitem => {
    workflowitem.log.map(historyevent =>
      redactHistoryEvent(
        historyevent,
        getAllowedIntents(userIdentities(asUser), workflowitem.permissions),
      ),
    );
    return scrubWorkflowitem(workflowitem, asUser);
  });

  return scrubbedWorkflowitems.map(removeEventLog);
}

export async function close(
  closingUser: User,
  workflowitemId: string,
  {
    getOrdering,
    getWorkflowitems,
    closeWorkflowitem,
    notify,
  }: {
    getOrdering: OrderingReader;
    getWorkflowitems: ListReader;
    closeWorkflowitem: Closer;
    notify: CloseNotifier;
  },
): Promise<void> {
  const workflowitemOrdering = await getOrdering();
  const workflowitems = await getWorkflowitems();
  const sortedWorkflowitems = sortWorkflowitems(workflowitems, workflowitemOrdering);
  const closingWorkflowitem = sortedWorkflowitems.find(item => item.id === workflowitemId);
  if (!closingWorkflowitem) {
    throw { kind: "PreconditionError", message: "Cannot find workflowitem in list" };
  } else {
    isWorkflowitemClosable(workflowitemId, closingUser, sortedWorkflowitems);

    await closeWorkflowitem(workflowitemId);
    await notify(closingWorkflowitem, closingUser);
  }
}

export async function update(
  updatingUser: User,
  workflowitemId: string,
  theUpdate: Update,
  {
    getWorkflowitems,
    updateWorkflowitem,
    notify,
  }: {
    getWorkflowitems: ListReader;
    updateWorkflowitem: Updater;
    notify: UpdateNotifier;
  },
): Promise<void> {
  const allowedIntent: Intent = "workflowitem.update";
  const workflowitemList: Workflowitem[] = await getWorkflowitems();
  console.log(
    { workflowitemIds: workflowitemList.map(item => item.id), workflowitemId },
    "Checking if workflowitem is in list",
  );
  const workflowitemToBeUpdated = workflowitemList.find(item => item.id === workflowitemId);
  if (!workflowitemToBeUpdated) {
    throw { kind: "PreconditionError", message: "Cannot find workflowitem in list" };
  } else {
    let updatedCurrencyAndAmount = false;
    const updatedWorkflowitemData: Update = {};
    inheritDefinedProperties(updatedWorkflowitemData, theUpdate, [
      "displayName",
      "description",
      "amount",
      "currency",
      "amountType",
    ]);
    if (!isUserAllowedTo(allowedIntent, workflowitemToBeUpdated, updatingUser)) {
      return Promise.reject("User is not allowed to update workflowitem");
    }
    if (!isEmpty(theUpdate.documents)) {
      updatedWorkflowitemData.documents = await hashDocuments(theUpdate.documents);
    }
    if (updatedWorkflowitemData.amountType === "N/A") {
      updatedCurrencyAndAmount = true;
      delete updatedWorkflowitemData.amount;
      delete updatedWorkflowitemData.currency;
    }
    if (isEmpty(updatedWorkflowitemData)) {
      return Promise.resolve();
    }

    const validatedWorkflowitem = validateWorkflowitem({
      // Data from original Workflowitem
      ...workflowitemToBeUpdated,
      // Possibly updated data
      displayName: updatedWorkflowitemData.displayName
        ? updatedWorkflowitemData.displayName
        : workflowitemToBeUpdated.displayName,
      amount: updatedWorkflowitemData.amount
        ? updatedWorkflowitemData.amount
        : workflowitemToBeUpdated.amount,
      currency: updatedCurrencyAndAmount
        ? updatedWorkflowitemData.currency
        : workflowitemToBeUpdated.currency,
      amountType: updatedCurrencyAndAmount
        ? updatedWorkflowitemData.amountType
        : workflowitemToBeUpdated.amountType,
      description: updatedWorkflowitemData.description
        ? updatedWorkflowitemData.description
        : workflowitemToBeUpdated.description,
      documents: updatedWorkflowitemData.documents
        ? updatedWorkflowitemData.documents
        : workflowitemToBeUpdated.documents,
    });

    await updateWorkflowitem(validatedWorkflowitem.id, updatedWorkflowitemData);
    await notify(validatedWorkflowitem, updatedWorkflowitemData);
  }
}
