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
import { registerUser } from "@/services/authApi"
import { AxiosError } from "axios"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()

  const schema = z
    .object({
      full_name: z.string().min(2).max(255),
      email: z.string().email().max(255),
      phone: z.string().trim().min(7).max(20).optional().or(z.literal("")),
      password: z.string().min(8).max(200),
      confirm_password: z.string().min(8).max(200),
    })
    .refine((v) => v.password === v.confirm_password, {
      message: "Passwords do not match",
      path: ["confirm_password"],
    })

  type Values = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      toast.error("Please fix the form errors.")
      return
    }

    try {
      await registerUser({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        phone: parsed.data.phone ? parsed.data.phone : undefined,
        password: parsed.data.password,
      })

      toast.success("Account created. Please login.")
      navigate("/login")
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
      toast.error(message ?? "Registration failed")
    }
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Enter your email below to create your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                <Input id="full_name" placeholder="Your name" required {...register("full_name")} />
                {errors.full_name ? (
                  <FieldDescription className="text-destructive">
                    {errors.full_name.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  {...register("email")}
                />
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </FieldDescription>
                {errors.email ? (
                  <FieldDescription className="text-destructive">
                    {errors.email.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" type="tel" placeholder="9876543210" {...register("phone")} />
                {errors.phone ? (
                  <FieldDescription className="text-destructive">
                    {errors.phone.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" required {...register("password")} />
                    {errors.password ? (
                      <FieldDescription className="text-destructive">
                        {errors.password.message}
                      </FieldDescription>
                    ) : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      {...register("confirm_password")}
                    />
                    {errors.confirm_password ? (
                      <FieldDescription className="text-destructive">
                        {errors.confirm_password.message}
                      </FieldDescription>
                    ) : null}
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Account"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Already have an account? <a href="/login">Sign in</a>
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
