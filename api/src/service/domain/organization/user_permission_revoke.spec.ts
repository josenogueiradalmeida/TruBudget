import { assert } from "chai";

import { Ctx } from "../../../lib/ctx";
import * as Result from "../../../result";
import { NotAuthorized } from "../errors/not_authorized";
import { ServiceUser } from "../organization/service_user";
import { newUserFromEvent } from "./user_eventsourcing";
import { revokeUserPermission } from "./user_permission_revoke";
import { UserRecord } from "./user_record";

const ctx: Ctx = { requestId: "", source: "test" };
const root: ServiceUser = { id: "root", groups: [] };
const alice: ServiceUser = { id: "alice", groups: ["alice_and_bob", "alice_and_bob_and_charlie"] };
const bob: ServiceUser = { id: "bob", groups: ["alice_and_bob", "alice_and_bob_and_charlie"] };
const charlie: ServiceUser = { id: "charlie", groups: ["alice_and_bob_and_charlie"] };

const grantIntent = "user.intent.grantPermission";
const userId = "dummy";
const baseUser: UserRecord = {
  id: userId,
  createdAt: new Date().toISOString(),
  organization: "dummy",
  displayName: "dummy",
  passwordHash: "password",
  permissions: { "user.intent.revokePermission": [alice.id] },
  address: "12345",
  encryptedPrivKey: "encrypted",
  log: [],
  additionalData: {},
};

const baseRepository = {
  getUser: async () => baseUser,
};

describe("Revoking user permissions: permissions", () => {
  it("Without the user.intent.revokePermission permission, a user cannot revoke user permissions", async () => {
    const result = await revokeUserPermission(ctx, alice, userId, bob.id, grantIntent, {
      getUser: async () =>
        Promise.resolve({
          ...baseUser,
          permissions: { "user.intent.grantPermission": [alice.id] },
        }),
    });

    // NotAuthorized error due to the missing permissions:
    assert.isTrue(Result.isErr(result), "Alice is not authorized to grant this permission");
    assert.instanceOf(result, NotAuthorized, "The error is of the type 'Not Authorized'");
  });

  it("The root user can always revoke user permissions", async () => {
    const result = await revokeUserPermission(ctx, root, userId, bob.id, grantIntent, {
      ...baseRepository,
    });

    assert.isTrue(Result.isOk(result));
  });
});

describe("Revoking user permissions: updates", () => {
  it("The permission is revoked if the user has the correct permissions", async () => {
    const result = await revokeUserPermission(ctx, alice, userId, bob.id, grantIntent, {
      getUser: async () =>
        Promise.resolve({
          ...baseUser,
          permissions: {
            "user.intent.revokePermission": [alice.id],
            "user.intent.grantPermission": [bob.id],
          },
        }),
    });
    if (Result.isErr(result)) {
      throw result;
    }

    const sourcedUser = result.reduce(
      (user, event) => newUserFromEvent(ctx, user, event),
      baseUser,
    );
    if (Result.isErr(sourcedUser)) {
      throw sourcedUser;
    }

    assert.isTrue(Result.isOk(result), "Alice is authorized to grant this permission");
    assert.isTrue(result.length > 0, "An event is created");
  });

  it("A not existing permission is revoked, nothing happens", async () => {
    const testIntent = "user.changePassword";
    const result = await revokeUserPermission(ctx, alice, userId, alice.id, testIntent, {
      getUser: async () =>
        Promise.resolve({
          ...baseUser,
          permissions: { "user.intent.revokePermission": [alice.id] },
        }),
    });
    if (Result.isErr(result)) {
      throw result;
    }

    const sourcedUser = result.reduce(
      (user, event) => newUserFromEvent(ctx, user, event),
      baseUser,
    );
    if (Result.isErr(sourcedUser)) {
      throw sourcedUser;
    }

    assert.isTrue(Result.isOk(result), "Alice is authorized to revoke this permission");
    assert.deepEqual(result, []);
  });
});
