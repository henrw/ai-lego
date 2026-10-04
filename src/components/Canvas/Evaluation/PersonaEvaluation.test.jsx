import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PersonaEvaluation from "./PersonaEvaluation";
import useMyStore from "../../../contexts/projectContext";
jest.mock("../../../authentication/UserAuthContext", () => ({ useUserAuth: () => ({ user: null }) }));
jest.mock("../../../contexts/projectContext", () => {
  const state = { projectId: "test-project", addEvaluation: jest.fn() };
  const hook = selector => selector(state);
  hook.getState = () => state;
  return { __esModule: true, default: hook };
});
const props = { isExpanded: true, setIsExpanded: jest.fn(), selectedPersona: [{ uid: "demo-persona-applicant", name: "Career changer", description: "Applicant with a career gap" }], selectedCardIds: ["data"], cardsData: [{ uid: "data", stage: "data", description: "Historical resumes" }], openAiApiKey: "sk-test-placeholder", setOpenAiApiKey: jest.fn() };
beforeEach(() => { sessionStorage.clear(); global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });
it("releases the pending state and shows a retryable error after an empty AI response", async () => {
  global.fetch.mockResolvedValue({ ok: true, headers: { get: () => "application/json" }, json: async () => ({ res: "" }) });
  render(<PersonaEvaluation {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Simulate persona's feeling" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("no text"));
  expect(screen.getByRole("button", { name: "Simulate persona's feeling" })).toBeEnabled();
  expect(screen.queryByText("Generating...")).not.toBeInTheDocument();
});
it("retains the draft after a failed save and reuses its ID when retrying", async () => {
  const save = useMyStore.getState().addEvaluation;
  save.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  render(<PersonaEvaluation {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Persona evaluation text" }), { target: { value: "My career gap may lead to an unfair ranking." } });
  fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("draft is retained"));
  expect(screen.getByRole("textbox", { name: "Persona evaluation text" }).value).toContain("career gap");
  fireEvent.click(screen.getByRole("button", { name: "Save", exact: true }));
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Persona evaluation text" })).toHaveValue(""));
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[0][2].uid).toBe(save.mock.calls[1][2].uid);
  expect(save.mock.calls[1][2].personaId).toBe("demo-persona-applicant");
});
it("aborts a pending simulation when the component unmounts", async () => {
  let signal;
  global.fetch.mockImplementation((url, options) => { signal = options.signal; return new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(new Error("Stopped")))); });
  const { unmount } = render(<PersonaEvaluation {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Simulate persona's feeling" }));
  unmount(); expect(signal.aborted).toBe(true);
});
