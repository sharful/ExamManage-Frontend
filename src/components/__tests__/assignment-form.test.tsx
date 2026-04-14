/**
 * Tests for <AssignmentForm />
 *
 * What is covered
 * ---------------
 * 1. Available invigilators shown — only the mocked available list appears in
 *    the Head / Invigilator 1 / Invigilator 2 select options.
 * 2. Cross-role exclusion — once an invigilator is chosen for one role, they
 *    no longer appear in the other role's options.
 * 3. Conflict warnings — OVER_CAPACITY and DUPLICATE_IN_ROOM banners render
 *    when conditions are met.
 * 4. Form validation — required-field errors surface on submit.
 * 5. Edit mode pre-fill — form resets to the provided assignment values.
 *
 * All network hooks are mocked at the module level so no server is required.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { AssignmentForm } from "@/components/exams/assignment-form";
import type { ExamAssignment, Invigilator, Room } from "@/types";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/hooks/use-exams", () => ({
  useCreateAssignment: vi.fn(),
  useUpdateAssignment: vi.fn(),
  useAvailableInvigilators: vi.fn(),
}));

vi.mock("@/hooks/use-rooms", () => ({
  useRooms: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Dialog uses browser APIs that jsdom doesn't fully support — stub it out.
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import {
  useCreateAssignment,
  useUpdateAssignment,
  useAvailableInvigilators,
} from "@/hooks/use-exams";
import { useRooms } from "@/hooks/use-rooms";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const INV_ALICE: Invigilator = {
  id: "inv-alice",
  name: "Alice Smith",
  department: "Math",
  institute: null,
  mobile: null,
  email: null,
  status: "available",
  remarks: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const INV_BOB: Invigilator = {
  id: "inv-bob",
  name: "Bob Jones",
  department: "Science",
  institute: null,
  mobile: null,
  email: null,
  status: "available",
  remarks: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const INV_CAROL: Invigilator = {
  id: "inv-carol",
  name: "Carol Wang",
  department: null,
  institute: null,
  mobile: null,
  email: null,
  status: "available",
  remarks: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const ROOM_BIG: Room = {
  id: "room-big",
  room_number: "101",
  max_seats: 50,
  created_at: "2024-01-01T00:00:00Z",
};

const ROOM_SMALL: Room = {
  id: "room-small",
  room_number: "102",
  max_seats: 10,
  created_at: "2024-01-01T00:00:00Z",
};

const DEFAULT_PROPS = {
  examId: "exam-1",
  examDate: "2026-06-15",
  timeSlot: "morning" as const,
};

// ── Setup helpers ─────────────────────────────────────────────────────────────

function setupMocks({
  invigilators = [INV_ALICE, INV_BOB, INV_CAROL],
  rooms = [ROOM_BIG, ROOM_SMALL],
}: {
  invigilators?: Invigilator[];
  rooms?: Room[];
} = {}) {
  vi.mocked(useAvailableInvigilators).mockReturnValue({ data: invigilators } as ReturnType<typeof useAvailableInvigilators>);
  vi.mocked(useRooms).mockReturnValue({
    data: {
      data: rooms,
      meta: { page: 1, limit: 200, total: rooms.length, pages: 1 },
    },
  } as ReturnType<typeof useRooms>);
  vi.mocked(useCreateAssignment).mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({ assignment: {}, conflicts: [] }),
  } as unknown as ReturnType<typeof useCreateAssignment>);
  vi.mocked(useUpdateAssignment).mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({ assignment: {}, conflicts: [] }),
  } as unknown as ReturnType<typeof useUpdateAssignment>);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("AssignmentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  // ── 1. Available invigilators shown ────────────────────────────────────────

  describe("available invigilators", () => {
    it("shows all available invigilators in head select", () => {
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      const headSelect = screen.getByLabelText(/head invigilator/i);
      const optionValues = Array.from(headSelect.querySelectorAll("option")).map(
        (o) => (o as HTMLOptionElement).value
      );

      expect(optionValues).toContain(INV_ALICE.id);
      expect(optionValues).toContain(INV_BOB.id);
      expect(optionValues).toContain(INV_CAROL.id);
    });

    it("shows all available invigilators in invigilator-1 select", () => {
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      const inv1Select = screen.getByLabelText(/invigilator 1/i);
      const optionValues = Array.from(inv1Select.querySelectorAll("option")).map(
        (o) => (o as HTMLOptionElement).value
      );

      expect(optionValues).toContain(INV_ALICE.id);
      expect(optionValues).toContain(INV_BOB.id);
    });

    it("shows all available invigilators in invigilator-2 select", () => {
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      const inv2Select = screen.getByLabelText(/invigilator 2/i);
      const optionValues = Array.from(inv2Select.querySelectorAll("option")).map(
        (o) => (o as HTMLOptionElement).value
      );

      expect(optionValues).toContain(INV_ALICE.id);
      expect(optionValues).toContain(INV_BOB.id);
    });

    it("shows only the provided available invigilators (not others)", () => {
      setupMocks({ invigilators: [INV_ALICE] });
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      const headSelect = screen.getByLabelText(/head invigilator/i);
      const optionValues = Array.from(headSelect.querySelectorAll("option")).map(
        (o) => (o as HTMLOptionElement).value
      );

      expect(optionValues).toContain(INV_ALICE.id);
      expect(optionValues).not.toContain(INV_BOB.id);
    });
  });

  // ── 2. Cross-role exclusion ────────────────────────────────────────────────

  describe("cross-role exclusion", () => {
    it("removes selected head from invigilator-1 options", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      await user.selectOptions(screen.getByLabelText(/head invigilator/i), INV_ALICE.id);

      const inv1Options = Array.from(
        screen.getByLabelText(/invigilator 1/i).querySelectorAll("option")
      ).map((o) => (o as HTMLOptionElement).value);

      expect(inv1Options).not.toContain(INV_ALICE.id);
      expect(inv1Options).toContain(INV_BOB.id);
    });

    it("removes selected invigilator-1 from head options", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      await user.selectOptions(screen.getByLabelText(/invigilator 1/i), INV_BOB.id);

      const headOptions = Array.from(
        screen.getByLabelText(/head invigilator/i).querySelectorAll("option")
      ).map((o) => (o as HTMLOptionElement).value);

      expect(headOptions).not.toContain(INV_BOB.id);
      expect(headOptions).toContain(INV_ALICE.id);
    });
  });

  // ── 3. Conflict warnings ───────────────────────────────────────────────────

  describe("conflict warnings", () => {
    it("shows OVER_CAPACITY warning when seats exceed room capacity", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      // Pick the small room (max 10 seats)
      await user.selectOptions(screen.getByLabelText(/^room/i), ROOM_SMALL.id);

      // Type a value that exceeds capacity
      const seatsInput = screen.getByLabelText(/seats/i);
      await user.clear(seatsInput);
      await user.type(seatsInput, "25");

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/seats.*exceed|over capacity/i);
    });

    it("does NOT show over-capacity warning when seats are within limit", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      await user.selectOptions(screen.getByLabelText(/^room/i), ROOM_SMALL.id);

      const seatsInput = screen.getByLabelText(/seats/i);
      await user.clear(seatsInput);
      await user.type(seatsInput, "5");

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows DUPLICATE_IN_ROOM warning in edit mode with pre-filled duplicate ids", async () => {
      const duplicateAssignment: ExamAssignment = {
        id: "assign-dup",
        exam_id: "exam-1",
        room_id: ROOM_BIG.id,
        seats: 10,
        head_invigilator_id: INV_ALICE.id,
        invigilator1_id: INV_ALICE.id, // same as head → duplicate
        invigilator2_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      render(<AssignmentForm {...DEFAULT_PROPS} assignment={duplicateAssignment} />);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/duplicate|same invigilator|multiple roles/i);
      });
    });
  });

  // ── 4. Form validation ─────────────────────────────────────────────────────

  describe("form validation", () => {
    it("shows error when room is not selected on submit", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      await user.click(screen.getByRole("button", { name: /add assignment/i }));

      await waitFor(() => {
        expect(screen.getByText(/room is required/i)).toBeInTheDocument();
      });
    });

    it("shows error when head invigilator is not selected on submit", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      await user.selectOptions(screen.getByLabelText(/^room/i), ROOM_BIG.id);
      await user.click(screen.getByRole("button", { name: /add assignment/i }));

      await waitFor(() => {
        expect(screen.getByText(/head invigilator is required/i)).toBeInTheDocument();
      });
    });

    it("shows error when invigilator 1 is not selected on submit", async () => {
      const user = userEvent.setup();
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      await user.selectOptions(screen.getByLabelText(/^room/i), ROOM_BIG.id);
      await user.selectOptions(screen.getByLabelText(/head invigilator/i), INV_ALICE.id);
      await user.click(screen.getByRole("button", { name: /add assignment/i }));

      await waitFor(() => {
        expect(screen.getByText(/invigilator 1 is required/i)).toBeInTheDocument();
      });
    });

    it("renders empty form fields by default (create mode)", () => {
      render(<AssignmentForm {...DEFAULT_PROPS} />);

      expect(screen.getByLabelText(/^room/i)).toHaveValue("");
      expect(screen.getByLabelText(/head invigilator/i)).toHaveValue("");
      expect(screen.getByLabelText(/invigilator 1/i)).toHaveValue("");
    });
  });

  // ── 5. Edit mode pre-fill ──────────────────────────────────────────────────

  describe("edit mode", () => {
    const existingAssignment: ExamAssignment = {
      id: "assign-existing",
      exam_id: "exam-1",
      room_id: ROOM_BIG.id,
      seats: 30,
      head_invigilator_id: INV_ALICE.id,
      invigilator1_id: INV_BOB.id,
      invigilator2_id: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("shows 'Save changes' button in edit mode", () => {
      render(<AssignmentForm {...DEFAULT_PROPS} assignment={existingAssignment} />);
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("pre-fills seats from existing assignment", async () => {
      render(<AssignmentForm {...DEFAULT_PROPS} assignment={existingAssignment} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/seats/i)).toHaveValue(30);
      });
    });

    it("pre-fills room from existing assignment", async () => {
      render(<AssignmentForm {...DEFAULT_PROPS} assignment={existingAssignment} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/^room/i)).toHaveValue(ROOM_BIG.id);
      });
    });
  });
});
