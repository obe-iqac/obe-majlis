"use client";

import { useState } from "react";
import {
  BookMarked,
  BookOpen,
  Briefcase,
  GraduationCap,
  Layers,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import CollegeAdminHeader from "@/components/college-admin/CollegeAdminHeader";
import CollegeAdminSidebar from "@/components/college-admin/CollegeAdminSidebar";
import { WorkspaceMode } from "@/components/college-admin/types";
import { useCollegeAdminData } from "@/components/college-admin/hooks/useCollegeAdminData";
import { useCollegeAdminFilters } from "@/components/college-admin/hooks/useCollegeAdminFilters";
import { useCollegeAdminHandlers } from "@/components/college-admin/hooks/useCollegeAdminHandlers";
import { mergeOptionsWithCurrentValue } from "@/components/college-admin/utils/attainmentHelpers";
import AttainmentWorkspace from "@/components/college-admin/workspaces/AttainmentWorkspace";
import ProgramOutcomesWorkspace from "@/components/college-admin/workspaces/ProgramOutcomesWorkspace";
import ProgrammeManagementWorkspace from "@/components/college-admin/workspaces/ProgrammeManagementWorkspace";
import FacultyManagementWorkspace from "@/components/college-admin/workspaces/FacultyManagementWorkspace";
import ProgrammeSupervisionWorkspace from "@/components/college-admin/workspaces/ProgrammeSupervisionWorkspace";
import CourseAllocationWorkspace from "@/components/college-admin/workspaces/CourseAllocationWorkspace";
import CourseManagementWorkspace from "@/components/college-admin/workspaces/CourseManagementWorkspace";
import { SERVER_URL } from "@/constants";

const submitToBackend = async (
  endpoint: string,
  payload: unknown,
  setPageMessage: (message: string) => void,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
) => {
  try {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `Request failed with status ${response.status}`,
      );
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    setPageMessage(`Error: ${errorMessage}`);
    return { success: false as const, error: errorMessage };
  }
};

export default function CollegeAdminPage() {
  const [activeWorkspace, setActiveWorkspace] =
    useState<WorkspaceMode>("attainment");

  const data = useCollegeAdminData();

  const filters = useCollegeAdminFilters({
    programmes: data.programmes,
    teachers: data.teachers,
    courses: data.courses,
    attainmentRanges: data.attainmentRanges,
    minLevel: data.minLevel,
    maxLevel: data.maxLevel,
  });

  const handlers = useCollegeAdminHandlers({
    submitToBackend,
    attainmentValues: data.attainmentValues,
    setAttainmentValues: data.setAttainmentValues,
    attainmentRanges: data.attainmentRanges,
    setAttainmentRanges: data.setAttainmentRanges,
    minLevel: data.minLevel,
    setMinLevel: data.setMinLevel,
    maxLevel: data.maxLevel,
    setMaxLevel: data.setMaxLevel,
    pos: data.pos,
    setPos: data.setPos,
    setAttainmentMessage: data.setAttainmentMessage,
    setPoMessage: data.setPoMessage,
    newPOValue: data.newPOValue,
    setNewPOValue: data.setNewPOValue,
    programmes: data.programmes,
    setProgrammes: data.setProgrammes,
    newProgrammeName: data.newProgrammeName,
    setNewProgrammeName: data.setNewProgrammeName,
    setProgrammeMessage: data.setProgrammeMessage,
    newTeacher: data.newTeacher,
    setNewTeacher: data.setNewTeacher,
    teachers: data.teachers,
    setTeachers: data.setTeachers,
    setFacultyMessage: data.setFacultyMessage,
    assignment: data.assignment,
    setAssignment: data.setAssignment,
    setAssignmentMessage: data.setAssignmentMessage,
    newCourse: data.newCourse,
    setNewCourse: data.setNewCourse,
    courses: data.courses,
    setCourses: data.setCourses,
    setCourseMessage: data.setCourseMessage,
    courseAssignment: data.courseAssignment,
    setCourseAllocationMessage: data.setCourseAllocationMessage,
  });

  const workspaceTabs: {
    id: WorkspaceMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: "attainment",
      label: "Attainment Configuration",
      icon: Layers,
    },
    {
      id: "programOutcomes",
      label: "Program Outcomes",
      icon: Target,
    },
    {
      id: "programmeManagement",
      label: "Programme Management",
      icon: GraduationCap,
    },
    {
      id: "courseManagement",
      label: "Course Management",
      icon: BookMarked,
    },
    {
      id: "facultyManagement",
      label: "Faculty Management",
      icon: UserRound,
    },
    {
      id: "programmeSuperv",
      label: "Programme Supervision",
      icon: Briefcase,
    },
    {
      id: "courseAllocation",
      label: "Course Allocation",
      icon: BookMarked,
    },
  ];

  const kpis = [
    {
      title: "Program Outcomes",
      value: data.pos.length,
      icon: Target,
    },
    {
      title: "Programmes",
      value: data.programmes.length,
      icon: BookOpen,
    },
    {
      title: "Faculty Members",
      value: data.teachers.length,
      icon: Users,
    },
    {
      title: "Courses",
      value: data.courses.length,
      icon: BookMarked,
    },
  ];

  const fieldClass =
    "h-10 w-full rounded-md border-0 bg-[#f4f6f8] px-3 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition placeholder:font-normal placeholder:text-slate-400 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const compactFieldClass =
    "h-9 w-full rounded-md border-0 bg-[#f4f6f8] px-2.5 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const primaryButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#17324a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#10263a] focus:outline-none focus:ring-2 focus:ring-[#17324a]/20";
  const secondaryButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20";
  const captionClass = "text-[0.68rem] font-bold uppercase text-[#587089]";
  const panelTitleClass = "mt-1 text-xl font-semibold text-[#111827]";
  const tableHeadClass =
    "px-3 py-3 text-left text-[0.68rem] font-bold uppercase text-[#64748b]";

  const attainmentValueOptions = (currentValue: number) =>
    mergeOptionsWithCurrentValue(data.attainmentOptions, currentValue);

  const boundValueOptions = (currentValue: number) =>
    mergeOptionsWithCurrentValue(data.configuredBoundOptions, currentValue);

  return (
    <main className="min-h-screen bg-[#eef1f4] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[228px_minmax(0,1fr)]">
        <CollegeAdminSidebar
          collegeName={data.collegeInfo?.name}
          captionClass={captionClass}
          workspaceTabs={workspaceTabs}
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
          kpis={kpis}
        />

        <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <CollegeAdminHeader
            captionClass={captionClass}
            workspaceTabs={workspaceTabs}
            activeWorkspace={activeWorkspace}
            kpis={kpis}
          />

          <section className="min-w-0 bg-[#fbfbfa] px-4 py-5 ring-1 ring-slate-200/80 sm:px-6 lg:px-8 lg:py-7">
            {activeWorkspace === "attainment" && (
              <AttainmentWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                compactFieldClass={compactFieldClass}
                primaryButtonClass={primaryButtonClass}
                secondaryButtonClass={secondaryButtonClass}
                tableHeadClass={tableHeadClass}
                minLevel={data.minLevel}
                maxLevel={data.maxLevel}
                attainmentValues={data.attainmentValues}
                attainmentRanges={data.attainmentRanges}
                attainmentOptions={data.attainmentOptions}
                percentageOptions={data.percentageOptions}
                rangeValidationMessage={filters.rangeValidationMessage}
                attainmentMessage={data.attainmentMessage}
                boundValueOptions={boundValueOptions}
                attainmentValueOptions={attainmentValueOptions}
                mergeOptionsWithCurrentValue={mergeOptionsWithCurrentValue}
                handleMinMaxChange={handlers.handleMinMaxChange}
                handleLevelChange={handlers.handleLevelChange}
                handleRangeSelectChange={handlers.handleRangeSelectChange}
                handleAddRange={handlers.handleAddRange}
                handleDeleteRange={handlers.handleDeleteRange}
                handleAttainmentSubmit={handlers.handleAttainmentSubmit}
              />
            )}

            {activeWorkspace === "programOutcomes" && (
              <ProgramOutcomesWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                primaryButtonClass={primaryButtonClass}
                tableHeadClass={tableHeadClass}
                newPOValue={data.newPOValue}
                setNewPOValue={data.setNewPOValue}
                poMessage={data.poMessage}
                pos={data.pos}
                handleAddPO={handlers.handleAddPO}
              />
            )}

            {activeWorkspace === "programmeManagement" && (
              <ProgrammeManagementWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                primaryButtonClass={primaryButtonClass}
                tableHeadClass={tableHeadClass}
                programmeSearch={filters.programmeSearch}
                setProgrammeSearch={filters.setProgrammeSearch}
                programmeStatusFilter={filters.programmeStatusFilter}
                setProgrammeStatusFilter={filters.setProgrammeStatusFilter}
                newProgrammeName={data.newProgrammeName}
                setNewProgrammeName={data.setNewProgrammeName}
                programmeMessage={data.programmeMessage}
                filteredProgrammeRows={filters.filteredProgrammeRows}
                handleProgrammeCreate={handlers.handleProgrammeCreate}
                handleProgrammeDelete={handlers.handleProgramDelete}
              />
            )}

            {activeWorkspace === "courseManagement" && (
              <CourseManagementWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                primaryButtonClass={primaryButtonClass}
                tableHeadClass={tableHeadClass}
                newCourse={data.newCourse}
                setNewCourse={data.setNewCourse}
                courseMessage={data.courseMessage}
                programmes={data.programmes}
                courseSearch={filters.courseSearch}
                setCourseSearch={filters.setCourseSearch}
                courseProgrammeFilter={filters.courseProgrammeFilter}
                setCourseProgrammeFilter={filters.setCourseProgrammeFilter}
                courseSemesterFilter={filters.courseSemesterFilter}
                setCourseSemesterFilter={filters.setCourseSemesterFilter}
                uniqueSemesters={filters.uniqueSemesters}
                filteredCoursesByProgramme={filters.filteredCoursesByProgramme}
                handleCourseCreate={handlers.handleCourseCreate}
                handleCourseDelete={handlers.handleCourseDelete}
              />
            )}

            {activeWorkspace === "facultyManagement" && (
              <FacultyManagementWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                primaryButtonClass={primaryButtonClass}
                tableHeadClass={tableHeadClass}
                facultySearch={filters.facultySearch}
                setFacultySearch={filters.setFacultySearch}
                facultyRoleFilter={filters.facultyRoleFilter}
                setFacultyRoleFilter={filters.setFacultyRoleFilter}
                facultyAssignmentFilter={filters.facultyAssignmentFilter}
                setFacultyAssignmentFilter={filters.setFacultyAssignmentFilter}
                newTeacher={data.newTeacher}
                setNewTeacher={data.setNewTeacher}
                facultyMessage={data.facultyMessage}
                filteredFacultyRows={filters.filteredFacultyRows}
                handleTeacherCreate={handlers.handleTeacherCreate}
              />
            )}

            {activeWorkspace === "programmeSuperv" && (
              <ProgrammeSupervisionWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                primaryButtonClass={primaryButtonClass}
                tableHeadClass={tableHeadClass}
                assignmentSearch={filters.assignmentSearch}
                setAssignmentSearch={filters.setAssignmentSearch}
                assignmentStatusFilter={filters.assignmentStatusFilter}
                setAssignmentStatusFilter={filters.setAssignmentStatusFilter}
                assignment={data.assignment}
                setAssignment={data.setAssignment}
                programmes={data.programmes}
                teachers={data.teachers}
                assignmentMessage={data.assignmentMessage}
                filteredAssignmentRows={filters.filteredAssignmentRows}
                handleAssignTeacher={handlers.handleAssignTeacher}
                handleRevokeTeacher={handlers.handleRevokeProgram}
              />
            )}

            {activeWorkspace === "courseAllocation" && (
              <CourseAllocationWorkspace
                captionClass={captionClass}
                panelTitleClass={panelTitleClass}
                fieldClass={fieldClass}
                primaryButtonClass={primaryButtonClass}
                tableHeadClass={tableHeadClass}
                courseAllocationSearch={filters.courseAllocationSearch}
                setCourseAllocationSearch={filters.setCourseAllocationSearch}
                courseAllocationProgrammeFilter={
                  filters.courseAllocationProgrammeFilter
                }
                setCourseAllocationProgrammeFilter={
                  filters.setCourseAllocationProgrammeFilter
                }
                courseAllocationSemesterFilter={
                  filters.courseAllocationSemesterFilter
                }
                setCourseAllocationSemesterFilter={
                  filters.setCourseAllocationSemesterFilter
                }
                uniqueSemesters={filters.uniqueSemesters}
                programmes={data.programmes}
                courses={data.courses}
                teachers={data.teachers}
                courseAssignment={data.courseAssignment}
                setCourseAssignment={data.setCourseAssignment}
                courseAllocationMessage={data.courseAllocationMessage}
                filteredCourseAllocationRows={
                  filters.filteredCourseAllocationRows
                }
                handleCourseAssignment={handlers.handleCourseAssignment}
                handleRevokeCourse={handlers.handleRevokeCourse}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
