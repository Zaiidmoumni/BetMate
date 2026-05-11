import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

export default function ForgotPassword() {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    // Handle form submission
    console.log(values)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-4">
      <div className="w-full max-w-md space-y-8 backdrop-blur-xl bg-blue-600/30 dark:bg-blue-800/30 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-blue-900 dark:text-white">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your email" 
                      {...field} 
                      className="bg-white/50 dark:bg-blue-800/50 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-white placeholder-blue-500 dark:placeholder-blue-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Button type="submit" className="w-full">
                Send Reset Link
              </Button>
            </div>
          </form>
        </Form>
        <div className="mt-4 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}