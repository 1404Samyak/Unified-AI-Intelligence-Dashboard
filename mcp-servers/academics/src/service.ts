import type { AcademicPolicy, Course } from "@campus/shared";
import { AcademicsRepository, type ExamSchedule, type Syllabus } from "./repository.js";

export class AcademicsService {
  constructor(private readonly repo: AcademicsRepository) {}

  searchAcademicHandbook(query = "") {
    const documents = this.repo.searchHandbook(query);
    return { source: "academics", count: documents.length, documents };
  }

  getAttendancePolicy() {
    return this.policy("attendance");
  }

  getExamPolicy() {
    return this.policy("exam");
  }

  getGradingPolicy() {
    return this.policy("grading");
  }

  getCourseDetails(courseCodeOrId: string) {
    const course = this.repo.getCourse(courseCodeOrId);
    return course ? { source: "academics", course: this.withFaculty(course), syllabus: this.repo.getSyllabus(course.code) } : { source: "academics", error: "Course not found" };
  }

  searchCourses(query = "") {
    const courses = this.repo.searchCourses(query).map((course) => this.withFaculty(course));
    return { source: "academics", count: courses.length, courses };
  }

  getCoursesByDepartment(department: string) {
    const lower = department.toLowerCase();
    const courses = this.repo.listCourses().filter((course) => course.department.toLowerCase().includes(lower)).map((course) => this.withFaculty(course));
    return { source: "academics", department, count: courses.length, courses };
  }

  getCoursesBySemester(semester: number, department?: string) {
    const courses = this.repo
      .listCourses()
      .filter((course) => course.semester === semester)
      .filter((course) => !department || course.department.toLowerCase().includes(department.toLowerCase()))
      .map((course) => this.withFaculty(course));
    return { source: "academics", semester, department, count: courses.length, courses };
  }

  getCoursePrerequisites(courseCodeOrId: string) {
    const course = this.repo.getCourse(courseCodeOrId);
    return course ? { source: "academics", course: course.code, prerequisites: course.prerequisites } : { source: "academics", error: "Course not found" };
  }

  getCourseCredits(courseCodeOrId: string) {
    const course = this.repo.getCourse(courseCodeOrId);
    return course ? { source: "academics", course: course.code, credits: course.credits } : { source: "academics", error: "Course not found" };
  }

  getSyllabus(courseCode: string) {
    const syllabus = this.repo.getSyllabus(courseCode);
    return syllabus ? { source: "academics", syllabus } : { source: "academics", error: "Syllabus not found" };
  }

  searchSyllabusTopics(query = "") {
    const syllabi = this.repo.searchSyllabusTopics(query);
    return { source: "academics", count: syllabi.length, syllabi };
  }

  getFacultyDetails(facultyIdOrName: string) {
    const faculty = this.repo.getFaculty(facultyIdOrName);
    return faculty ? { source: "academics", faculty } : { source: "academics", error: "Faculty not found" };
  }

  searchFaculty(query = "") {
    const faculty = this.repo.searchFaculty(query);
    return { source: "academics", count: faculty.length, faculty };
  }

  getAcademicCalendar(type?: string) {
    const calendar = this.repo.listCalendar().filter((item) => !type || item.type === type);
    return { source: "academics", calendar };
  }

  getExamSchedule(courseCode?: string) {
    return { source: "academics", exams: this.repo.listExamSchedules(courseCode) };
  }

  getAssignmentDeadlines(courseCode?: string) {
    const deadlines = this.repo
      .listCalendar()
      .filter((item) => item.type === "assignment")
      .filter((item) => !courseCode || item.courseCode === courseCode);
    return { source: "academics", deadlines };
  }

  getHolidayList() {
    const holidays = this.repo.listCalendar().filter((item) => item.type === "holiday");
    return { source: "academics", holidays };
  }

  getLabRules() {
    return this.policy("lab");
  }

  getLibraryRules() {
    return this.policy("library");
  }

  getHostelRules() {
    return this.policy("hostel");
  }

  getScholarshipInfo() {
    return this.policy("scholarship");
  }

  getFeeDeadlines() {
    return this.policy("fees");
  }

  getDepartmentNotices(department?: string) {
    return { source: "academics", notices: this.repo.listNotices(department) };
  }

  createCourse(input: Omit<Course, "id">) {
    return { source: "academics", course: this.repo.createCourse(input) };
  }

  updateCourse(courseIdOrCode: string, patch: Partial<Course>) {
    const course = this.repo.updateCourse(courseIdOrCode, patch);
    return course ? { source: "academics", course } : { source: "academics", error: "Course not found" };
  }

  deleteCourse(courseIdOrCode: string) {
    return { source: "academics", deleted: this.repo.deleteCourse(courseIdOrCode) };
  }

  createSyllabus(input: Omit<Syllabus, "id" | "updatedAt">) {
    return { source: "academics", syllabus: this.repo.createSyllabus(input) };
  }

  updateSyllabus(courseCode: string, patch: Partial<Syllabus>) {
    const syllabus = this.repo.updateSyllabus(courseCode, patch);
    return syllabus ? { source: "academics", syllabus } : { source: "academics", error: "Syllabus not found" };
  }

  createPolicyDocument(input: Omit<AcademicPolicy, "id" | "updatedAt">) {
    return { source: "academics", policy: this.repo.createPolicy(input) };
  }

  updatePolicyDocument(policyId: string, patch: Partial<AcademicPolicy>) {
    const policy = this.repo.updatePolicy(policyId, patch);
    return policy ? { source: "academics", policy } : { source: "academics", error: "Policy not found" };
  }

  createAcademicNotice(title: string, body: string, department = "all") {
    return { source: "academics", notice: this.repo.createNotice({ title, body, department }) };
  }

  updateAcademicNotice(noticeId: string, patch: { title?: string; body?: string; department?: string }) {
    const notice = this.repo.updateNotice(noticeId, patch);
    return notice ? { source: "academics", notice } : { source: "academics", error: "Notice not found" };
  }

  createExamSchedule(input: Omit<ExamSchedule, "id">) {
    return { source: "academics", exam: this.repo.createExamSchedule(input) };
  }

  updateExamSchedule(examId: string, patch: Partial<ExamSchedule>) {
    const exam = this.repo.updateExamSchedule(examId, patch);
    return exam ? { source: "academics", exam } : { source: "academics", error: "Exam schedule not found" };
  }

  private policy(category: AcademicPolicy["category"]) {
    const policy = this.repo.getPolicy(category);
    return policy ? { source: "academics", policy } : { source: "academics", error: "Policy not found" };
  }

  private withFaculty(course: Course) {
    return { ...course, faculty: this.repo.getFaculty(course.facultyId) };
  }
}
