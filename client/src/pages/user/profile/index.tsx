import React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

import { useMe, useUpdateProfile } from "@/features/auth/hooks"

const schema = z
  .object({
    full_name: z.string().min(2).max(255).optional(),
    phone: z.union([z.string().trim().min(7).max(20), z.literal(""), z.null()]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" })

type Values = z.infer<typeof schema>

export default function ProfilePage() {
  const me = useMe()
  const update = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      full_name: "",
      phone: "",
    },
  })

  React.useEffect(() => {
    if (me.data?.data) {
      reset({
        full_name: me.data.data.full_name ?? "",
        phone: me.data.data.phone ?? "",
      })
    }
  }, [me.data, reset])

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      toast.error("Please fix the form errors.")
      return
    }

    try {
      await update.mutateAsync({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone === "" ? null : parsed.data.phone,
      })
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to update profile")
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 text-sm">Update your profile information.</p>
      </div>

      <Card className="bg-white border">
        <CardHeader>
          <CardTitle className="text-slate-900">Account</CardTitle>
        </CardHeader>
        <CardContent>
          {me.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" value={me.data?.data.email ?? ""} disabled />
                </Field>
                <Field>
                  <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                  <Input id="full_name" placeholder="Your name" {...register("full_name")} />
                  {errors.full_name ? (
                    <FieldDescription className="text-destructive">
                      {errors.full_name.message}
                    </FieldDescription>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input id="phone" placeholder="9876543210" {...register("phone")} />
                  {errors.phone ? (
                    <FieldDescription className="text-destructive">
                      {errors.phone.message as string}
                    </FieldDescription>
                  ) : null}
                </Field>
                <Field>
                  <Button type="submit" disabled={isSubmitting || update.isPending}>
                    {isSubmitting || update.isPending ? "Saving..." : "Save changes"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
