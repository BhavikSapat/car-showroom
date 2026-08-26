import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User as UserIcon,
  Lock,
  Loader2,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface LoginPageProps {
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // Execute login request
      await login(username.trim(), password.trim());
    } catch (err: any) {
      console.log("Login Submit Error:", err);
      setErrorMsg(err.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFAFB] p-4 font-sans">
      <div className="w-full max-w-sm bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-white border-b border-[#E4E4E7] p-6 text-center relative">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-xs font-semibold text-[#71717A] hover:text-[#FF5A36] mb-3 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Grand Theft Autos Home</span>
            </button>
          )}
          <div className="mb-2 flex flex-col justify-center items-center ">
            <img src="/favicon.png" width={70} height={70} className="" />
            <h1 className="text-lg font-extrabold uppercase font-heading tracking-tight text-[#18181B]">
              Grand Theft Autos
            </h1>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            Car Showroom Management Portal
          </p>
          {/* <div className="mt-3 py-1 px-2.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded text-[11px] text-[#71717A]">
            Staff Portal Sign In
          </div> */}
        </div>

        {/* Form Area */}
        <div className="p-6">
          {successMsg && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded text-xs font-medium text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-xs font-medium text-red-700 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#71717A] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
                />
                <UserIcon className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#71717A] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
                />
                <Lock className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>Sign In</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
