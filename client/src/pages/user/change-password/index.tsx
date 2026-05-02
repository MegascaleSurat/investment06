import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

import { useChangePassword } from "@/features/auth/hooks"

const schema = z.object({
  old_password: z.string().min(1).max(200),
  new_password: z.string().min(8).max(200),
})

type Values = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const changePassword = useChangePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: { old_password: "", new_password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      toast.error("Please fix the form errors.")
      return
    }

    try {
      await changePassword.mutateAsync(parsed.data)
      toast.success("Password changed")
      reset()
    } catch {
      toast.error("Failed to change password")
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
        <p className="text-slate-500 text-sm">Update your password regularly to stay secure.</p>
      </div>

      <Card className="bg-white border">
        <CardHeader>
          <CardTitle className="text-slate-900">Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="old_password">Current password</FieldLabel>
                <Input id="old_password" type="password" {...register("old_password")} />
                {errors.old_password ? (
                  <FieldDescription className="text-destructive">
                    {errors.old_password.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="new_password">New password</FieldLabel>
                <Input id="new_password" type="password" {...register("new_password")} />
                {errors.new_password ? (
                  <FieldDescription className="text-destructive">
                    {errors.new_password.message}
                  </FieldDescription>
                ) : null}
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting || changePassword.isPending}>
                  {isSubmitting || changePassword.isPending ? "Updating..." : "Update password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
