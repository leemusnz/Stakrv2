/** @jest-environment node */
// Regression (Codex security review, PR #11): confirming evidence copied the
// uploaded object to a fresh random key each time. The "already confirmed"
// check runs before the copy and the insert after it, so concurrent replays of
// one fileKey each wrote their own copy and only one row survived: orphaned
// objects, with nothing referencing or deleting them, at the caller's will.
const mockSent: { kind: string; input: Record<string, any> }[] = [];

jest.mock("@aws-sdk/client-s3", () => {
  const command = (kind: string) =>
    class {
      kind = kind;
      constructor(public input: Record<string, any>) {}
    };
  return {
    S3Client: class {
      async send(cmd: { kind: string; input: Record<string, any> }) {
        mockSent.push(cmd);
        if (cmd.kind !== "head") return {};
        const [, , challenge, user] = String(cmd.input.Key).split("/");
        return {
          ETag: '"etag-1"',
          ContentType: "image/jpeg",
          ContentLength: 2048,
          Metadata: { "user-id": user, "challenge-id": challenge },
        };
      }
    },
    PutObjectCommand: command("put"),
    DeleteObjectCommand: command("delete"),
    GetObjectCommand: command("get"),
    HeadObjectCommand: command("head"),
    CopyObjectCommand: command("copy"),
  };
});
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: async () => "https://signed.example",
}));

const user = "00000000-0000-4000-8000-000000000001";
const challenge = "00000000-0000-4000-8000-0000000000c1";
const sourceKey = (name: string) =>
  `verification-files/images/${challenge}/${user}/${name}`;

async function confirm(key: string) {
  const { confirmEvidenceObject } = await import("@/lib/storage");
  return confirmEvidenceObject(key, user, challenge);
}
const copiedTo = () =>
  mockSent.filter((c) => c.kind === "copy").map((c) => c.input.Key as string);

describe("confirmEvidenceObject", () => {
  beforeAll(() => {
    process.env.AWS_ACCESS_KEY_ID = "test";
    process.env.AWS_SECRET_ACCESS_KEY = "test";
  });
  beforeEach(() => {
    mockSent.length = 0;
  });

  it("replays of one upload all target the same evidence object, so none are orphaned", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () => confirm(sourceKey("a.jpg"))),
    );
    expect(new Set(results.map((r) => r.storageKey)).size).toBe(1);
    expect(new Set(copiedTo()).size).toBe(1);
  });

  it("gives different uploads different evidence objects under the user's own prefix", async () => {
    const a = await confirm(sourceKey("a.jpg"));
    const b = await confirm(sourceKey("b.jpg"));
    expect(a.storageKey).not.toBe(b.storageKey);
    for (const { storageKey } of [a, b])
      expect(storageKey).toMatch(
        new RegExp(
          `^confirmed-evidence/${challenge}/${user}/[0-9a-f]{32}\\.jpg$`,
        ),
      );
  });

  it("still refuses a key that is not this user's upload for this challenge", async () => {
    await expect(
      confirm(`verification-files/images/${challenge}/someone-else/a.jpg`),
    ).rejects.toThrow("Invalid evidence key");
    expect(copiedTo()).toHaveLength(0);
  });
});
