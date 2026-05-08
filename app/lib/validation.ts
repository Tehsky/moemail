import { z } from "zod"

const USERNAME_MAX_LENGTH = 20
const RANDOM_USERNAME_PREFIX = "user_"
const RANDOM_USERNAME_SUFFIX_LENGTH = 8
const USERNAME_ALLOWED_REGEX = /^[a-zA-Z0-9_-]+$/

export function normalizeUsername(username?: string | null) {
  return username?.trim() ?? ""
}

export function generateRandomUsername() {
  const randomPart = Math.random().toString(36).slice(2, 2 + RANDOM_USERNAME_SUFFIX_LENGTH)
  return `${RANDOM_USERNAME_PREFIX}${randomPart}`
}

export const authSchema = z.object({
  username: z.string()
    .max(USERNAME_MAX_LENGTH, "用户名不能超过20个字符")
    .refine(val => normalizeUsername(val).length === 0 || USERNAME_ALLOWED_REGEX.test(normalizeUsername(val)), "用户名只能包含字母、数字、下划线和横杠")
    .refine(val => {
      const normalized = normalizeUsername(val)
      return normalized.length === 0 || !normalized.includes('@')
    }, "用户名不能是邮箱格式")
    .transform(normalizeUsername),
  password: z.string()
    .min(8, "密码长度必须大于等于8位"),
  turnstileToken: z.string().optional()
})

export type AuthSchema = z.infer<typeof authSchema>
