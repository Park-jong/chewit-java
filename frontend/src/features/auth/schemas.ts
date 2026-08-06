import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  displayName: z.string().min(1, '이름을 입력해주세요.'),
})

export type SignupFormValues = z.infer<typeof signupSchema>
