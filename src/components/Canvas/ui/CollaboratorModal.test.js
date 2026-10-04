jest.mock("../../../firebase", () => ({ db: {} }));
import { makeShareUrl } from "./CollaboratorModal";
it("preserves existing URL parameters without appending another question mark or granting membership", () => {
  const url = new URL(makeShareUrl("https://example.org/project/old?view=review&usp=sharing#fragment", "new-id"));
  expect(url.pathname).toBe("/project/new-id"); expect(url.searchParams.get("view")).toBe("review");
  expect(url.searchParams.has("usp")).toBe(false); expect(url.hash).toBe("");
});
