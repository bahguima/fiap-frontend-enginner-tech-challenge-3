import {
  FIREBASE_DEMO_PROJECT_ID,
  getFirebaseOptions,
  resolveUseFirebaseEmulators,
  useFirebaseEmulators,
} from "./config";

describe("Firebase development configuration", () => {
  it("uses the safe demo project when local variables are absent", () => {
    expect(useFirebaseEmulators).toBe(true);
    expect(getFirebaseOptions()).toMatchObject({
      projectId: FIREBASE_DEMO_PROJECT_ID,
      authDomain: `${FIREBASE_DEMO_PROJECT_ID}.firebaseapp.com`,
    });
  });

  it("defaults to emulators when the preference is absent", () => {
    expect(
      resolveUseFirebaseEmulators({
        emulatorPreference: undefined,
        nodeEnv: "production",
      }),
    ).toBe(true);
  });

  it("rejects invalid emulator preferences", () => {
    expect(() =>
      resolveUseFirebaseEmulators({
        emulatorPreference: "yes",
        nodeEnv: "development",
      }),
    ).toThrow("must be either true or false");
  });

  it("never permits Firebase real during tests", () => {
    expect(() =>
      resolveUseFirebaseEmulators({
        emulatorPreference: "false",
        nodeEnv: "test",
      }),
    ).toThrow("Firebase real is disabled in tests");
  });
});
