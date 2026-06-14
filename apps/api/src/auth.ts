import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ensureAuthTable, query } from "@campus/db";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export type AuthUser = {
  id: string;
  role: "student";
  name: string;
  email: string;
  yearOfStudy?: number;
  branch?: string;
  semester?: 1 | 2;
  enrollmentNumber?: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

const tokenSecret = () => process.env.AUTH_SECRET ?? "dev-campus-dashboard-secret-change-me";

const base64Url = (value: Buffer | string) =>
  Buffer.from(value).toString("base64url");

const parseBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const signToken = (payload: Record<string, unknown>) => {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    })
  );
  const signature = createHmac("sha256", tokenSecret())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
};

const verifyToken = (token: string) => {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return undefined;
  const expected = createHmac("sha256", tokenSecret())
    .update(`${header}.${body}`)
    .digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return undefined;
  }

  const payload = JSON.parse(parseBase64Url(body)) as { sub?: string; exp?: number };
  if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return undefined;
  }
  return payload.sub;
};

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  const [method, salt, hash] = stored.split("$");
  if (method !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
};

const userFields = `
    id,
    role,
    name,
    email,
    year_of_study as "yearOfStudy",
    branch,
    semester,
    enrollment_number as "enrollmentNumber"
`;

const toPublicUser = (row: Record<string, unknown>): AuthUser => ({
  id: String(row.id),
  role: "student",
  name: String(row.name),
  email: String(row.email),
  yearOfStudy: row.yearOfStudy === null || row.yearOfStudy === undefined ? undefined : Number(row.yearOfStudy),
  branch: row.branch ? String(row.branch) : undefined,
  semester: row.semester === null || row.semester === undefined ? undefined : (Number(row.semester) as 1 | 2),
  enrollmentNumber: row.enrollmentNumber ? String(row.enrollmentNumber) : undefined
});

const registerSchema = z.object({
  role: z.literal("student").default("student"),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  yearOfStudy: z.number().int().min(1).max(5),
  branch: z.string().min(2),
  semester: z.union([z.literal(1), z.literal(2)]),
  enrollmentNumber: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function initializeAuth() {
  await ensureAuthTable();
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const input = parsed.data;
  const id = `student-${randomBytes(12).toString("hex")}`;
  const passwordHash = hashPassword(input.password);

  try {
    const result = await query<Record<string, unknown>>(
      `
        INSERT INTO public.users (
          id, role, name, email, password_hash, year_of_study, branch, semester,
          enrollment_number
        )
        VALUES ($1, 'student', $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          role,
          name,
          email,
          year_of_study as "yearOfStudy",
          branch,
          semester,
          enrollment_number as "enrollmentNumber"
      `,
      [
        id,
        input.name.trim(),
        input.email.trim().toLowerCase(),
        passwordHash,
        input.yearOfStudy,
        input.branch.trim(),
        input.semester,
        input.enrollmentNumber.trim()
      ]
    );

    const user = toPublicUser(result.rows[0]);
    res.status(201).json({ user, token: signToken({ sub: user.id, role: user.role }) });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("duplicate")
      ? "A student with this email or enrollment number already exists."
      : error instanceof Error
        ? error.message
        : "Registration failed";
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const result = await query<Record<string, unknown>>(
    `
      SELECT
      ${userFields},
      password_hash as "passwordHash"
      FROM public.users
      WHERE email = $1 AND role = 'student'
    `,
    [parsed.data.email.trim().toLowerCase()]
  );

  const row = result.rows[0];
  if (!row || !verifyPassword(parsed.data.password, String(row.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const user = toPublicUser(row);
  res.json({ user, token: signToken({ sub: user.id, role: user.role }) });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  res.json({ user: req.user });
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  const userId = token ? verifyToken(token) : undefined;

  if (!userId) {
    res.status(401).json({ error: "Please log in to continue." });
    return;
  }

  const result = await query<Record<string, unknown>>(`SELECT ${userFields} FROM public.users WHERE id = $1 AND role = 'student'`, [userId]);
  const row = result.rows[0];
  if (!row) {
    res.status(401).json({ error: "User session is no longer valid." });
    return;
  }

  (req as AuthenticatedRequest).user = toPublicUser(row);
  next();
}
