import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Eye, EyeOff, Key, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/services/AuthService";
import { toastNotifier } from "@/utils/toastNotifier";
import { GridLoader } from "react-spinners";

const formSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formStatus, setFormStatus] = useState({ success: false, message: "" });
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.password !== values.confirmPassword) {
      setFormStatus({
        success: false,
        message: "Passwords do not match",
      });
    }

    const credentials = {
      email: values.email,
      name: values.name,
      password: values.password,
    };

    try {
      setLoading(true);
      const response = await registerUser(credentials);
      if (!response) {
        setFormStatus({
          success: false,
          message: "Something went wrong. Please try again",
        });
        setLoading(false);
        return;
      }
      if (response.error) {
        toastNotifier({
          message:
            typeof response.error === "string"
              ? response.error
              : JSON.stringify(response.error),
          type: "error",
          duration: 3000,
        });
      }

      toastNotifier({
        message: "Register Successfull, Please check your email to continue",
        type: "success",
        duration: 5000,
      });
      setLoading(false);
      navigate("/");
    } catch (error) {
      setFormStatus({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <GridLoader color="#d64218" size={10} />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Display Success/Error Message */}
        {formStatus.message && (
          <div
            className={`text-center text-sm p-2 rounded-md ${
              formStatus.success
                ? "bg-green-200 text-green-700"
                : "bg-red-200 text-red-700"
            }`}
          >
            {formStatus.message}
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Username</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Bet Mate"
                    {...field}
                    className="bg-black border-orange-400 pl-10 text-white"
                  />
                </div>
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
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="betmate@email.com"
                    {...field}
                    className="bg-black border-orange-400 pl-10 text-white"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex w-full items-center justify-between">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      className="bg-black border-orange-400 pl-10 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 bg-transparent border-0 right-0 pr-3 flex items-center text-blue-700 hover:text-black dark:text-blue-300 dark:hover:text-blue-100 transition-colors duration-200"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 opacity-70 hover:opacity-100" />
                      ) : (
                        <Eye className="h-4 w-4 opacity-70 hover:opacity-100" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="********"
                      {...field}
                      className="bg-black border-orange-400 pl-10 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 bg-transparent border-0 right-0 pr-3 flex items-center text-blue-700 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100 transition-colors duration-200"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 opacity-70 hover:opacity-100" />
                      ) : (
                        <Eye className="h-4 w-4 opacity-70 hover:opacity-100" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          Register
        </Button>
      </form>
    </Form>
  );
}
