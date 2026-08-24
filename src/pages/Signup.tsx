import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { registerUser } from "../api/paperiqApi";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser(name, email, password);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || "Failed to register. Try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Start exploring"
      title="Create your workspace"
      description="One account is all you need to turn complex documents into useful answers."
      footer={(
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-violet-300 transition-colors hover:text-cyan-300">
            Sign in
          </Link>
        </>
      )}
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-200">Full name</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="paperiq-field pl-11" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-200">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="paperiq-field pl-11" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-200">Password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} className="paperiq-field pl-11" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">Confirm password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
            <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="paperiq-field pl-11" required />
          </div>
        </div>

        <Button type="submit" className="paperiq-primary-button mt-2 w-full" disabled={isLoading}>
          {isLoading ? "Creating your workspace..." : "Create free account"}
          {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Signup;
