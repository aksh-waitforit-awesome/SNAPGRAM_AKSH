import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavLink } from "react-router-dom"
import { useLogin } from "@/react-query/QueryAndMutation"
import { loginSchema, type LoginFormData } from "@/schema/auth.schema"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })
  const { mutate: loginUser, isPending } = useLogin()
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => loginUser(data))}
        className="w-full max-w-md flex flex-col gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-center lg:text-left">
            Welcome Back!
          </h1>

          <p className="text-sm sm:text-base text-gray-500 text-center lg:text-left">
            Please enter your details to sign in to your account
          </p>
        </div>

        {/* Email */}
        <Field className="space-y-2">
          <FieldLabel>Email</FieldLabel>

          <InputGroup className="h-12 flex gap-1 items-center p-2 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-violet-600">
            <InputGroupInput
              type="email"
              placeholder="Enter your email"
              className="h-12 "
              {...register("email")}
            />

            <InputGroupAddon>
              <Mail size={18} />
            </InputGroupAddon>
          </InputGroup>
          {errors.email && (
            <FieldDescription>{errors.email.message}</FieldDescription>
          )}
        </Field>

        {/* Password */}
        <Field className="space-y-2">
          <FieldLabel>Password</FieldLabel>

          <InputGroup className="h-12 flex gap-1 items-center p-2 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-violet-600">
            <InputGroupAddon>
              <LockKeyhole size={18} />
            </InputGroupAddon>

            <InputGroupInput
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-12 "
              {...register("password")}
            />

            <InputGroupAddon align="inline-end">
              {showPassword ? (
                <EyeOff
                  onClick={() => setShowPassword(false)}
                  size={18}
                  className="cursor-pointer"
                />
              ) : (
                <Eye
                  onClick={() => setShowPassword(true)}
                  size={18}
                  className="cursor-pointer"
                />
              )}
            </InputGroupAddon>
          </InputGroup>
          {errors.password && (
            <FieldDescription>{errors.password.message}</FieldDescription>
          )}
        </Field>

        {/* Forgot Password */}
        <div className="flex justify-end">
          <a
            href="/forgot-password"
            className="text-sm text-violet-600 hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        {/* Button */}
        <Button
          type="submit"
          disabled={isPending || isSubmitting}
          className="h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg"
        >
          {isPending || isSubmitting ? "...Submitting" : "Login"}
        </Button>

        {/* Signup */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <NavLink
            to="/auth/register"
            className="text-violet-600 font-medium hover:underline"
          >
            Sign up
          </NavLink>
        </p>
      </form>
    </>
  )
}

export default LoginForm
