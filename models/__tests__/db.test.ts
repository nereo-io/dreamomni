const createClient = jest.fn(() => ({ from: jest.fn() }));

jest.mock("@supabase/supabase-js", () => ({
  createClient,
}));

import { getSupabaseClient } from "@/models/db";

describe("getSupabaseClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("requires the service role key for server DB access", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";

    expect(() => getSupabaseClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates clients with the service role key", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    getSupabaseClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
    );
  });
});
