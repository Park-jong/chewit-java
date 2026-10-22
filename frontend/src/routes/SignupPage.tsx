import { ThemeToggle } from '@/features/theme/ThemeToggle'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/features/auth/AuthContext'
import { signupSchema, type SignupFormValues } from '@/features/auth/schemas'
import { getErrorMessage } from '@/lib/error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  })

  async function onSubmit(values: SignupFormValues) {
    setFormError(null)
    try {
      await signup(values)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, '회원가입에 실패했습니다.'))
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="fixed right-3 top-3">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>chewit 회원가입</CardTitle>
          <CardDescription>몇 가지 정보만 입력하면 시작할 수 있어요.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름</FormLabel>
                    <FormControl>
                      <Input placeholder="닉네임" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </CardContent>
            <CardFooter className="mt-4 flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '가입 중...' : '회원가입'}
              </Button>
              <p className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="text-primary underline underline-offset-4">
                  로그인
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
