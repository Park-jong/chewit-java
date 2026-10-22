import { ThemeToggle } from '@/features/theme/ThemeToggle'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/features/auth/AuthContext'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas'
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

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    try {
      await login(values)
      navigate('/', { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error, '로그인에 실패했습니다.'))
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="fixed right-3 top-3">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>chewit 로그인</CardTitle>
          <CardDescription>이메일과 비밀번호를 입력해주세요.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
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
                {form.formState.isSubmitting ? '로그인 중...' : '로그인'}
              </Button>
              <p className="text-sm text-muted-foreground">
                계정이 없으신가요?{' '}
                <Link to="/signup" className="text-primary underline underline-offset-4">
                  회원가입
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
