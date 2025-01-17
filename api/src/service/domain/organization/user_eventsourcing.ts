import { VError } from "verror";

import { Ctx } from "../../../lib/ctx";
import deepcopy from "../../../lib/deepcopy";
import * as Result from "../../../result";
import { BusinessEvent } from "../business_event";
import { EventSourcingError } from "../errors/event_sourcing_error";
import * as UserCreated from "./user_created";
import * as UserPasswordChanged from "./user_password_changed";
import * as UserRecord from "./user_record";
import { UserTraceEvent } from "./user_trace_event";

export function sourceUserRecords(
  ctx: Ctx,
  events: BusinessEvent[],
  origin?: Map<UserRecord.Id, UserRecord.UserRecord>,
): { users: UserRecord.UserRecord[]; errors: Error[] } {
  const users =
    origin === undefined
      ? new Map<UserRecord.Id, UserRecord.UserRecord>()
      : new Map<UserRecord.Id, UserRecord.UserRecord>(origin);
  const errors: Error[] = [];

  for (const event of events) {
    if (!event.type.startsWith("user_")) {
      continue;
    }

    const user = sourceEvent(ctx, event, users);
    if (Result.isErr(user)) {
      errors.push(user);
    } else {
      user.log.push(newTraceEvent(user, event));
      users.set(user.id, user);
    }
  }

  return { users: [...users.values()], errors };
}

function newTraceEvent(user: UserRecord.UserRecord, event: BusinessEvent): UserTraceEvent {
  return {
    entityId: user.id,
    entityType: "user",
    businessEvent: event,
    snapshot: {
      displayName: user.displayName,
    },
  };
}

function sourceEvent(
  ctx: Ctx,
  event: BusinessEvent,
  users: Map<UserRecord.Id, UserRecord.UserRecord>,
): Result.Type<UserRecord.UserRecord> {
  const userId = getUserId(event);
  let user: Result.Type<UserRecord.UserRecord>;
  if (Result.isOk(userId)) {
    // The event refers to an existing user, so
    // the user should have been initialized already.

    user = get(users, userId);
    if (Result.isErr(user)) {
      return new VError(`user ID ${userId} found in event ${event.type} is invalid`);
    }

    user = newUserFromEvent(ctx, user, event);
    if (Result.isErr(user)) {
      return user; // <- event-sourcing error
    }
  } else {
    // The event does not refer to a user ID, so it must be a creation event:
    if (event.type !== "user_created") {
      return new VError(
        `event ${event.type} is not of type "user_created" but also ` +
          "does not include a user ID",
      );
    }

    user = UserCreated.createFrom(ctx, event);
    if (Result.isErr(user)) {
      return new VError(user, "could not create user from event");
    }
  }

  return user;
}

function get(
  users: Map<UserRecord.Id, UserRecord.UserRecord>,
  userId: UserRecord.Id,
): Result.Type<UserRecord.UserRecord> {
  const user = users.get(userId);
  if (user === undefined) {
    return new VError(`user ${userId} not yet initialized`);
  }
  return user;
}

function getUserId(event: BusinessEvent): Result.Type<UserRecord.Id> {
  switch (event.type) {
    case "user_password_changed":
      return event.user.id;

    default:
      return new VError(`cannot find user ID in event of type ${event.type}`);
  }
}

/** Returns a new user with the given event applied, or an error. */
export function newUserFromEvent(
  ctx: Ctx,
  user: UserRecord.UserRecord,
  event: BusinessEvent,
): Result.Type<UserRecord.UserRecord> {
  const eventModule = getEventModule(event);

  // Ensure that we never modify user or event in-place by passing copies. When
  // copying the user, its event log is omitted for performance reasons.
  const eventCopy = deepcopy(event);
  const userCopy = copyUserExceptLog(user);

  try {
    // Apply the event to the copied user:
    const mutation = eventModule.mutate(userCopy, eventCopy);
    if (Result.isErr(mutation)) {
      throw mutation;
    }

    // Validate the modified user:
    const validation = UserRecord.validate(userCopy);
    if (Result.isErr(validation)) {
      throw validation;
    }

    // Restore the event log:
    userCopy.log = user.log;

    // Return the modified (and validated) user:
    return userCopy;
  } catch (error) {
    return new EventSourcingError({ ctx, event, target: user }, error);
  }
}

type EventModule = {
  mutate: (user: UserRecord.UserRecord, event: BusinessEvent) => Result.Type<void>;
};
function getEventModule(event: BusinessEvent): EventModule {
  switch (event.type) {
    case "user_password_changed":
      return UserPasswordChanged;

    default:
      throw new VError(`unknown user event ${event.type}`);
  }
}

function copyUserExceptLog(user: UserRecord.UserRecord): UserRecord.UserRecord {
  const { log, ...tmp } = user;
  const copy = deepcopy(tmp);
  (copy as any).log = [];
  return copy as UserRecord.UserRecord;
}
