import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkIfBookerEmailIsBlocked } from "./checkIfBookerEmailIsBlocked";
import { verifyCodeUnAuthenticated } from "@calcom/features/auth/lib/verifyCodeUnAuthenticated";
import prisma from "@calcom/prisma";

vi.mock("@calcom/features/auth/lib/verifyCodeUnAuthenticated", () => ({
  verifyCodeUnAuthenticated: vi.fn(),
}));

vi.mock("@calcom/prisma", () => ({
  default: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe("checkIfBookerEmailIsBlocked", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes full bookerEmail to verifyCodeUnAuthenticated for plus-address aliases", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 100,
      email: "person@example.org",
      requiresBookerEmailVerification: true,
    } as any);

    vi.mocked(verifyCodeUnAuthenticated).mockResolvedValueOnce(true);

    const result = await checkIfBookerEmailIsBlocked({
      bookerEmail: "person+test@example.org",
      loggedInUserId: undefined,
      verificationCode: "123456",
      isReschedule: false,
    });

    expect(result).toBe(false);
    expect(verifyCodeUnAuthenticated).toHaveBeenCalledWith("person+test@example.org", "123456");
  });

  it("throws InvalidVerificationCode when verification code is invalid", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 100,
      email: "person@example.org",
      requiresBookerEmailVerification: true,
    } as any);

    vi.mocked(verifyCodeUnAuthenticated).mockResolvedValueOnce(false);

    await expect(
      checkIfBookerEmailIsBlocked({
        bookerEmail: "person+test@example.org",
        loggedInUserId: undefined,
        verificationCode: "wrong-code",
        isReschedule: false,
      })
    ).rejects.toThrow("Invalid verification code");
  });
});
