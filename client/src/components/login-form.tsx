import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { AxiosError } from "axios"
import { useLogin } from "@/features/auth/hooks"
import { loginSchema } from "@/features/auth/schemas"
import type { UserRole } from "@/services/auth.service"
import { decodeJwtPayload } from "@/utils/jwt"

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      toast.error("Please enter a valid email and password.")
      return
    }

    try {
      const res = await login.mutateAsync(parsed.data)
      toast.success("Login successful")

      const payload = decodeJwtPayload<{ roles?: UserRole }>(res.data.token)
      const role = payload?.roles ?? "USER"
      if (role === "ADMIN") navigate("/admin/dashboard")
      else navigate("/dashboard")
    } catch (err: unknown) {
      const ax = err as AxiosError<unknown>
      const data = ax.response?.data as unknown
      let message: string | undefined
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>
        if (typeof obj.message === "string") message = obj.message
        if (!message && obj.error && typeof obj.error === "object") {
          const errObj = obj.error as Record<string, unknown>
          if (typeof errObj.message === "string") message = errObj.message
        }
      }
      toast.error(message ?? "Login failed")
    }
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup className="py-12">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Acme Inc account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  {...register("email")}
                />
                {errors.email ? (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required {...register("password")} />
                {errors.password ? (
                  <FieldDescription className="text-destructive">
                    {errors.password.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account? <a href="/signup">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
