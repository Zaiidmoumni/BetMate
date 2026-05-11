"use client";

import type React from "react";

import { useState } from "react";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/services/AuthService";
import { toastNotifier } from "@/utils/toastNotifier";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage("Please enter your email address");
      setState("error");
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword(email);

      if (!response) {
        setErrorMessage("Something went wrong. Please try again");
        setState("error");
        return;
      }

      setState("success");
      toastNotifier({
        message: "Reset instructions sent to your email",
        type: "success",
        duration: 3000,
      });

      setLoading(false);
    } catch (error) {
      setState("error");
      setErrorMessage("An unexpected error occurred");
      console.error("Forgot password error:", error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
        <div className="w-full max-w-md p-8 rounded-lg bg-[#1e1e1e] border border-gray-800">
          <Link
            to="/login"
            className="flex items-center text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Link>
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 text-[#ff7b26] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Sending reset instructions...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="w-full max-w-md p-8 rounded-lg bg-[#1e1e1e] border border-gray-800">
        <Link
          to="/login"
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Link>

        {state === "idle" || state === "error" ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">
              Forgot Password
            </h1>
            <p className="text-gray-400 mb-6">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {state === "error" && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-400 mb-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 rounded-md bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff7b26] focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#ff7b26] hover:bg-[#e66c1e] text-white rounded-md font-medium transition-colors"
              >
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-400 mb-6">
              We've sent password reset instructions to:
              <br />
              <span className="font-medium text-white">{email}</span>
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                If you don't see the email, check your spam folder or make sure
                you entered the correct email address.
              </p>
              <button
                onClick={() => setState("idle")}
                className="text-[#ff7b26] hover:text-[#e66c1e] font-medium"
              >
                Try another email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
