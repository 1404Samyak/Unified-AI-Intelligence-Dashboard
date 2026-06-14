import { registerJsonTool } from "@campus/mcp-common";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AcademicsService } from "./service.js";

const policyCategory = z.enum(["attendance", "exam", "grading", "lab", "library", "hostel", "scholarship", "fees", "general"]);
const examType = z.enum(["mid-semester", "end-semester", "lab", "quiz"]);

const courseInput = {
  code: z.string(),
  title: z.string(),
  department: z.string(),
  semester: z.number().int().min(1).max(12),
  credits: z.number().min(0),
  prerequisites: z.array(z.string()).default([]),
  facultyId: z.string(),
  description: z.string()
};

const syllabusUnit = z.object({
  title: z.string(),
  topics: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([])
});

export function registerAcademicsTools(server: McpServer, service: AcademicsService) {
  registerJsonTool(server, "search_academic_handbook", "Search academic handbook policies and rules.", {
    query: z.string().default("")
  }, (args) => service.searchAcademicHandbook(args.query));
  registerJsonTool(server, "get_attendance_policy", "Get the attendance policy.", {}, () => service.getAttendancePolicy());
  registerJsonTool(server, "get_exam_policy", "Get examination policy.", {}, () => service.getExamPolicy());
  registerJsonTool(server, "get_grading_policy", "Get grading policy.", {}, () => service.getGradingPolicy());
  registerJsonTool(server, "get_course_details", "Get course details, faculty, and syllabus summary.", {
    courseCodeOrId: z.string()
  }, (args) => service.getCourseDetails(args.courseCodeOrId));
  registerJsonTool(server, "search_courses", "Search courses by title, code, department, description, or prerequisite.", {
    query: z.string().default("")
  }, (args) => service.searchCourses(args.query));
  registerJsonTool(server, "get_courses_by_department", "List courses for a department.", {
    department: z.string()
  }, (args) => service.getCoursesByDepartment(args.department));
  registerJsonTool(server, "get_courses_by_semester", "List courses for a semester, optionally scoped to department.", {
    semester: z.number().int().min(1).max(12),
    department: z.string().optional()
  }, (args) => service.getCoursesBySemester(args.semester, args.department));
  registerJsonTool(server, "get_course_prerequisites", "Get prerequisites for a course.", {
    courseCodeOrId: z.string()
  }, (args) => service.getCoursePrerequisites(args.courseCodeOrId));
  registerJsonTool(server, "get_course_credits", "Get credit value for a course.", {
    courseCodeOrId: z.string()
  }, (args) => service.getCourseCredits(args.courseCodeOrId));
  registerJsonTool(server, "get_syllabus", "Get syllabus for a course.", {
    courseCode: z.string()
  }, (args) => service.getSyllabus(args.courseCode));
  registerJsonTool(server, "search_syllabus_topics", "Search topics across syllabi.", {
    query: z.string().default("")
  }, (args) => service.searchSyllabusTopics(args.query));
  registerJsonTool(server, "get_faculty_details", "Get faculty details.", {
    facultyIdOrName: z.string()
  }, (args) => service.getFacultyDetails(args.facultyIdOrName));
  registerJsonTool(server, "search_faculty", "Search faculty by name, department, email, or office.", {
    query: z.string().default("")
  }, (args) => service.searchFaculty(args.query));
  registerJsonTool(server, "get_academic_calendar", "Get academic calendar items, optionally by type.", {
    type: z.string().optional()
  }, (args) => service.getAcademicCalendar(args.type));
  registerJsonTool(server, "get_exam_schedule", "Get exam schedule, optionally for a course.", {
    courseCode: z.string().optional()
  }, (args) => service.getExamSchedule(args.courseCode));
  registerJsonTool(server, "get_assignment_deadlines", "Get assignment deadlines, optionally for a course.", {
    courseCode: z.string().optional()
  }, (args) => service.getAssignmentDeadlines(args.courseCode));
  registerJsonTool(server, "get_holiday_list", "Get academic holidays.", {}, () => service.getHolidayList());
  registerJsonTool(server, "get_lab_rules", "Get lab rules.", {}, () => service.getLabRules());
  registerJsonTool(server, "get_library_rules", "Get academic library rules.", {}, () => service.getLibraryRules());
  registerJsonTool(server, "get_hostel_rules", "Get hostel rules.", {}, () => service.getHostelRules());
  registerJsonTool(server, "get_scholarship_info", "Get scholarship information.", {}, () => service.getScholarshipInfo());
  registerJsonTool(server, "get_fee_deadlines", "Get fee deadlines and policy.", {}, () => service.getFeeDeadlines());
  registerJsonTool(server, "get_department_notices", "Get department notices.", {
    department: z.string().optional()
  }, (args) => service.getDepartmentNotices(args.department));
  registerJsonTool(server, "create_course", "Admin: create a course.", courseInput, (args) => service.createCourse(args));
  registerJsonTool(server, "update_course", "Admin: update a course.", {
    courseIdOrCode: z.string(),
    patch: z.record(z.unknown())
  }, (args) => service.updateCourse(args.courseIdOrCode, args.patch));
  registerJsonTool(server, "delete_course", "Admin: delete a course.", {
    courseIdOrCode: z.string()
  }, (args) => service.deleteCourse(args.courseIdOrCode));
  registerJsonTool(server, "create_syllabus", "Admin: create syllabus for a course.", {
    courseCode: z.string(),
    units: z.array(syllabusUnit).default([]),
    textbooks: z.array(z.string()).default([])
  }, (args) => service.createSyllabus(args));
  registerJsonTool(server, "update_syllabus", "Admin: update syllabus for a course.", {
    courseCode: z.string(),
    patch: z.record(z.unknown())
  }, (args) => service.updateSyllabus(args.courseCode, args.patch));
  registerJsonTool(server, "create_policy_document", "Admin: create academic policy document.", {
    title: z.string(),
    category: policyCategory,
    body: z.string()
  }, (args) => service.createPolicyDocument(args));
  registerJsonTool(server, "update_policy_document", "Admin: update academic policy document.", {
    policyId: z.string(),
    patch: z.record(z.unknown())
  }, (args) => service.updatePolicyDocument(args.policyId, args.patch));
  registerJsonTool(server, "create_academic_notice", "Admin: create academic notice.", {
    title: z.string(),
    body: z.string(),
    department: z.string().default("all")
  }, (args) => service.createAcademicNotice(args.title, args.body, args.department));
  registerJsonTool(server, "update_academic_notice", "Admin: update academic notice.", {
    noticeId: z.string(),
    patch: z.object({
      title: z.string().optional(),
      body: z.string().optional(),
      department: z.string().optional()
    })
  }, (args) => service.updateAcademicNotice(args.noticeId, args.patch));
  registerJsonTool(server, "create_exam_schedule", "Admin: create exam schedule entry.", {
    courseCode: z.string(),
    examType,
    startsAt: z.string(),
    endsAt: z.string(),
    venue: z.string()
  }, (args) => service.createExamSchedule(args));
  registerJsonTool(server, "update_exam_schedule", "Admin: update exam schedule entry.", {
    examId: z.string(),
    patch: z.object({
      courseCode: z.string().optional(),
      examType: examType.optional(),
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
      venue: z.string().optional()
    })
  }, (args) => service.updateExamSchedule(args.examId, args.patch));
}
