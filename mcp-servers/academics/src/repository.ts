import { randomUUID } from "node:crypto";
import { tryQuery } from "@campus/db";
import {
  academicCalendar,
  academicPolicies,
  courses,
  faculties,
  type AcademicPolicy,
  type Course,
  type Faculty
} from "@campus/shared";

const normalize = (value: string) => value.trim().toLowerCase();

export type Syllabus = {
  id: string;
  courseCode: string;
  units: Array<{
    title: string;
    topics: string[];
    outcomes: string[];
  }>;
  textbooks: string[];
  updatedAt: string;
};

export type AcademicNotice = {
  id: string;
  title: string;
  body: string;
  department: string;
  createdAt: string;
};

export type ExamSchedule = {
  id: string;
  courseCode: string;
  examType: "mid-semester" | "end-semester" | "lab" | "quiz";
  startsAt: string;
  endsAt: string;
  venue: string;
};

export class AcademicsRepository {
  private courses = [...courses];
  private faculties = [...faculties];
  private policies = [...academicPolicies];
  private calendar = [...academicCalendar];
  private syllabi: Syllabus[] = [
    {
      id: "syllabus-cs305",
      courseCode: "CS305",
      units: [
        {
          title: "Relational Model and SQL",
          topics: ["relational algebra", "normalization", "joins", "aggregations"],
          outcomes: ["Design normalized schemas", "Write analytical SQL queries"]
        },
        {
          title: "Transactions and Indexes",
          topics: ["ACID", "locking", "B+ trees", "query plans"],
          outcomes: ["Explain transaction isolation", "Choose indexes for workloads"]
        }
      ],
      textbooks: ["Database System Concepts"],
      updatedAt: new Date().toISOString()
    },
    {
      id: "syllabus-cs411",
      courseCode: "CS411",
      units: [
        {
          title: "Intelligent Agents and Search",
          topics: ["agents", "uninformed search", "heuristic search", "A*"],
          outcomes: ["Model problems as search spaces", "Compare search strategies"]
        },
        {
          title: "Knowledge and Learning",
          topics: ["logic", "probabilistic reasoning", "machine learning basics", "tool calling"],
          outcomes: ["Represent knowledge", "Explain AI-assisted systems"]
        }
      ],
      textbooks: ["Artificial Intelligence: A Modern Approach"],
      updatedAt: new Date().toISOString()
    }
  ];
  private notices: AcademicNotice[] = [
    {
      id: "notice-cse-lab",
      title: "CSE lab slot change",
      body: "CS305 database lab for Batch B moves to Friday 2 PM this week.",
      department: "Computer Science",
      createdAt: new Date().toISOString()
    }
  ];
  private examSchedules: ExamSchedule[] = [
    {
      id: "exam-cs305-mid",
      courseCode: "CS305",
      examType: "mid-semester",
      startsAt: this.futureDate(35, 9),
      endsAt: this.futureDate(35, 11),
      venue: "Exam Hall 2"
    },
    {
      id: "exam-cs411-quiz",
      courseCode: "CS411",
      examType: "quiz",
      startsAt: this.futureDate(14, 10),
      endsAt: this.futureDate(14, 10, 45),
      venue: "CSE-201"
    }
  ];

  async loadFromDatabase() {
    const [faculty, dbCourses, policies, calendar, syllabi, notices, exams] = await Promise.all([
      tryQuery<Faculty>("SELECT id, name, department, email, office FROM academics.faculty ORDER BY name"),
      tryQuery<{
        id: string;
        code: string;
        title: string;
        department: string;
        semester: number;
        credits: string | number;
        prerequisites: string[];
        facultyId: string;
        description: string;
      }>(
        'SELECT id, code, title, department, semester, credits, prerequisites, faculty_id as "facultyId", description FROM academics.courses ORDER BY code'
      ),
      tryQuery<{
        id: string;
        title: string;
        category: AcademicPolicy["category"];
        body: string;
        updatedAt: Date;
      }>('SELECT id, title, category, body, updated_at as "updatedAt" FROM academics.policies ORDER BY title'),
      tryQuery<{
        id: string;
        title: string;
        type: string;
        date: Date;
        department: string;
        courseCode: string | null;
      }>('SELECT id, title, item_type as "type", item_date as "date", department, course_code as "courseCode" FROM academics.calendar_items ORDER BY item_date'),
      tryQuery<{
        id: string;
        courseCode: string;
        units: Syllabus["units"];
        textbooks: string[];
        updatedAt: Date;
      }>('SELECT id, course_code as "courseCode", units, textbooks, updated_at as "updatedAt" FROM academics.syllabi ORDER BY course_code'),
      tryQuery<{
        id: string;
        title: string;
        body: string;
        department: string;
        createdAt: Date;
      }>('SELECT id, title, body, department, created_at as "createdAt" FROM academics.notices ORDER BY created_at DESC'),
      tryQuery<{
        id: string;
        courseCode: string;
        examType: ExamSchedule["examType"];
        startsAt: Date;
        endsAt: Date;
        venue: string;
      }>('SELECT id, course_code as "courseCode", exam_type as "examType", starts_at as "startsAt", ends_at as "endsAt", venue FROM academics.exam_schedules ORDER BY starts_at')
    ]);

    if (faculty?.rows.length) {
      this.faculties = faculty.rows;
    }

    if (dbCourses?.rows.length) {
      this.courses = dbCourses.rows.map((course) => ({
        ...course,
        credits: Number(course.credits)
      }));
    }

    if (policies?.rows.length) {
      this.policies = policies.rows.map((policy) => ({
        ...policy,
        updatedAt: policy.updatedAt.toISOString()
      }));
    }

    if (calendar?.rows.length) {
      this.calendar = calendar.rows.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        date: item.date.toISOString(),
        department: item.department,
        ...(item.courseCode ? { courseCode: item.courseCode } : {})
      }));
    }

    if (syllabi?.rows.length) {
      this.syllabi = syllabi.rows.map((syllabus) => ({
        ...syllabus,
        updatedAt: syllabus.updatedAt.toISOString()
      }));
    }

    if (notices?.rows.length) {
      this.notices = notices.rows.map((notice) => ({
        ...notice,
        createdAt: notice.createdAt.toISOString()
      }));
    }

    if (exams?.rows.length) {
      this.examSchedules = exams.rows.map((exam) => ({
        ...exam,
        startsAt: exam.startsAt.toISOString(),
        endsAt: exam.endsAt.toISOString()
      }));
    }
  }

  searchHandbook(query = "") {
    const needle = normalize(query);
    return this.policies.filter((policy) => {
      if (!query) return true;
      return [policy.title, policy.category, policy.body].some((value) => normalize(value).includes(needle));
    });
  }

  getPolicy(category: AcademicPolicy["category"]) {
    return this.policies.find((policy) => policy.category === category);
  }

  searchCourses(query = "") {
    const needle = normalize(query);
    return this.courses.filter((course) => {
      if (!query) return true;
      return [
        course.code,
        course.title,
        course.department,
        course.description,
        ...course.prerequisites
      ].some((value) => normalize(value).includes(needle));
    });
  }

  getCourse(courseCodeOrId: string) {
    const needle = normalize(courseCodeOrId);
    return this.courses.find((course) => course.id === courseCodeOrId || normalize(course.code) === needle || normalize(course.title).includes(needle));
  }

  listCourses() {
    return this.courses;
  }

  listFaculties() {
    return this.faculties;
  }

  getFaculty(facultyIdOrName: string) {
    const needle = normalize(facultyIdOrName);
    return this.faculties.find((faculty) => faculty.id === facultyIdOrName || normalize(faculty.name).includes(needle));
  }

  searchFaculty(query = "") {
    const needle = normalize(query);
    return this.faculties.filter((faculty) => {
      if (!query) return true;
      return [faculty.name, faculty.department, faculty.email, faculty.office].some((value) => normalize(value).includes(needle));
    });
  }

  getSyllabus(courseCode: string) {
    return this.syllabi.find((syllabus) => normalize(syllabus.courseCode) === normalize(courseCode));
  }

  searchSyllabusTopics(query = "") {
    const needle = normalize(query);
    return this.syllabi.filter((syllabus) =>
      syllabus.units.some((unit) =>
        [unit.title, ...unit.topics, ...unit.outcomes].some((value) => normalize(value).includes(needle))
      )
    );
  }

  listCalendar() {
    return this.calendar;
  }

  listExamSchedules(courseCode?: string) {
    return courseCode ? this.examSchedules.filter((exam) => normalize(exam.courseCode) === normalize(courseCode)) : this.examSchedules;
  }

  listNotices(department?: string) {
    return department ? this.notices.filter((notice) => normalize(notice.department).includes(normalize(department))) : this.notices;
  }

  createCourse(input: Omit<Course, "id">) {
    const course = { ...input, id: `course-${randomUUID()}` };
    this.courses.push(course);
    return course;
  }

  updateCourse(courseIdOrCode: string, patch: Partial<Course>) {
    const course = this.getCourse(courseIdOrCode);
    if (!course) return undefined;
    Object.assign(course, patch, { id: course.id });
    return course;
  }

  deleteCourse(courseIdOrCode: string) {
    const course = this.getCourse(courseIdOrCode);
    if (!course) return false;
    this.courses = this.courses.filter((entry) => entry.id !== course.id);
    this.syllabi = this.syllabi.filter((entry) => normalize(entry.courseCode) !== normalize(course.code));
    return true;
  }

  createSyllabus(input: Omit<Syllabus, "id" | "updatedAt">) {
    const syllabus = { ...input, id: `syllabus-${randomUUID()}`, updatedAt: new Date().toISOString() };
    this.syllabi.push(syllabus);
    return syllabus;
  }

  updateSyllabus(courseCode: string, patch: Partial<Syllabus>) {
    const syllabus = this.getSyllabus(courseCode);
    if (!syllabus) return undefined;
    Object.assign(syllabus, patch, { id: syllabus.id, courseCode: syllabus.courseCode, updatedAt: new Date().toISOString() });
    return syllabus;
  }

  createPolicy(input: Omit<AcademicPolicy, "id" | "updatedAt">) {
    const policy = { ...input, id: `policy-${randomUUID()}`, updatedAt: new Date().toISOString() };
    this.policies.push(policy);
    return policy;
  }

  updatePolicy(policyId: string, patch: Partial<AcademicPolicy>) {
    const policy = this.policies.find((entry) => entry.id === policyId);
    if (!policy) return undefined;
    Object.assign(policy, patch, { id: policy.id, updatedAt: new Date().toISOString() });
    return policy;
  }

  createNotice(input: Omit<AcademicNotice, "id" | "createdAt">) {
    const notice = { ...input, id: `notice-${randomUUID()}`, createdAt: new Date().toISOString() };
    this.notices.push(notice);
    return notice;
  }

  updateNotice(noticeId: string, patch: Partial<AcademicNotice>) {
    const notice = this.notices.find((entry) => entry.id === noticeId);
    if (!notice) return undefined;
    Object.assign(notice, patch, { id: notice.id });
    return notice;
  }

  createExamSchedule(input: Omit<ExamSchedule, "id">) {
    const exam = { ...input, id: `exam-${randomUUID()}` };
    this.examSchedules.push(exam);
    return exam;
  }

  updateExamSchedule(examId: string, patch: Partial<ExamSchedule>) {
    const exam = this.examSchedules.find((entry) => entry.id === examId);
    if (!exam) return undefined;
    Object.assign(exam, patch, { id: exam.id });
    return exam;
  }

  private futureDate(offsetDays: number, hour: number, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  }
}
