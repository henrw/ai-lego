import { act, renderHook } from "@testing-library/react";
import useSessionState from "./useSessionState";

beforeEach(() => sessionStorage.clear());
it("restores generated persona suggestions on remount and isolates projects", () => {
  const first = renderHook(() => useSessionState("project-a-candidates", []));
  act(() => first.result.current[1](["Applicant", "Hiring manager"]));
  first.unmount();
  const restored = renderHook(({ project }) => useSessionState(`${project}-candidates`, []), { initialProps: { project: "project-a" } });
  expect(restored.result.current[0]).toEqual(["Applicant", "Hiring manager"]);
  restored.rerender({ project: "project-b" });
  expect(restored.result.current[0]).toEqual([]);
});
