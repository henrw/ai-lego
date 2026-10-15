import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectNotes from "./ProjectNotes";
import useMyStore from "../../../contexts/projectContext";
jest.mock("../../../contexts/projectContext", () => {
  const state = { projectId: "notes-test", notes: "", isDemo: true, setProjectNotes: jest.fn() };
  const hook = selector => selector(state);
  hook.getState = () => state;
  return { __esModule: true, default: hook };
});
beforeEach(() => {
  sessionStorage.clear();
  const state = useMyStore.getState();
  state.notes = "";
  state.setProjectNotes.mockImplementation(async value => { state.notes = value; return true; });
});
it("shows an empty field by default and keeps entered text when expanded and collapsed", async () => {
  render(<ProjectNotes />);
  expect(screen.getByRole("textbox", { name: "Project notes" })).toHaveValue("");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Background context" } });
  fireEvent.click(screen.getByRole("button", { name: "Expand project notes" }));
  expect(screen.getByRole("button", { name: "Collapse project notes" })).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(screen.getByRole("button", { name: "Collapse project notes" }));
  expect(screen.getByRole("textbox")).toHaveValue("Background context");
  await waitFor(() => expect(sessionStorage.getItem("project-notes-draft-notes-test")).toBeNull());
});
it("restores an unsaved draft on remount when a save fails", async () => {
  useMyStore.getState().setProjectNotes.mockResolvedValue(false);
  const view = render(<ProjectNotes />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Unsent notes" } });
  await waitFor(() => expect(sessionStorage.getItem("project-notes-draft-notes-test")).toBe("Unsent notes"));
  view.unmount();
  render(<ProjectNotes />);
  expect(screen.getByRole("textbox")).toHaveValue("Unsent notes");
});
