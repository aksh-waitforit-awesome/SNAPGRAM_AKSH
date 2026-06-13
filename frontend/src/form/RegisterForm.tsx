import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Eye, EyeOff, LockKeyhole, Mail, User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavLink } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/schema/auth.schema"
import { useState } from "react"
import { useRegister } from "@/react-query/QueryAndMutation"
const RegisterForm = () => {
  //const navigate = useNavigate()
  const { mutate: registerUser, isPending } = useRegister()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })
  const [showPassword, setShowPassword] = useState(true)

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => registerUser(data))}
        className="w-full max-w-md flex flex-col gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-center lg:text-left">
            Create Account
          </h1>

          <p className="text-sm sm:text-base text-gray-500 text-center lg:text-left">
            Please enter your details to sign up to your account
          </p>
        </div>
        {/* Username */}
        <Field className="space-y-2">
          <FieldLabel>Username</FieldLabel>
          <InputGroup className="h-12 flex gap-1 items-center p-2 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-violet-600">
            <InputGroupAddon>
              <User2 size={18} />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="Enter your username"
              className=" flex-1 bg-transparent focus:bg-transparent focus:outline-none"
              {...register("username")}
            />
          </InputGroup>
          {errors.username && (
            <FieldDescription>{errors.username.message}</FieldDescription>
          )}
        </Field>
        {/* Email */}
        <Field className="space-y-2">
          <FieldLabel>Email</FieldLabel>

          <InputGroup className="h-12 flex gap-1 p-2 items-center">
            <InputGroupAddon>
              <Mail size={18} />
            </InputGroupAddon>
            <InputGroupInput
              type="email"
              placeholder="Enter your email"
              className=" flex-1 bg-transparent focus:bg-transparent focus:outline-none"
              {...register("email")}
            />
          </InputGroup>
          {errors.email && (
            <FieldDescription>{errors.email.message}</FieldDescription>
          )}
        </Field>

        {/* Password */}
        <Field className="space-y-2">
          <FieldLabel>Password</FieldLabel>

          <InputGroup className="h-12 flex gap-1 p-2 items-center">
            <InputGroupAddon>
              <LockKeyhole size={18} />
            </InputGroupAddon>
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
            <InputGroupInput
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className=" flex-1 bg-transparent focus:bg-transparent focus:outline-none"
              {...register("password")}
            />
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
          disabled={isSubmitting || isPending}
          className="h-12 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg"
        >
          {isSubmitting || isPending ? "Submitting..." : "Register"}
        </Button>

        {/* Signup */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <NavLink
            to="/auth/login"
            className="text-violet-600 font-medium hover:underline"
          >
            Sign in
          </NavLink>
        </p>
      </form>
    </>
  )
}

export default RegisterForm
