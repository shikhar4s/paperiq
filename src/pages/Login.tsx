import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { loginUser } from "../api/paperiqApi";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginUser(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/dashboard");
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to PaperIQ"
      description="Pick up where you left off and discover what your documents have to say."
      footer={(
        <>
          New to PaperIQ?{" "}
          <Link to="/signup" className="font-semibold text-[#b6583b] transition-colors hover:text-[#173b31]">
            Create an account
          </Link>
        </>
      )}
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-sm font-medium text-[#304038]">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#7a8176]" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="paperiq-field pl-11"
              required
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-sm font-medium text-[#304038]">Password</Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#7a8176]" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="paperiq-field pl-11"
              required
            />
          </div>
        </div>

        <Button type="submit" className="paperiq-primary-button mt-2 w-full" disabled={isLoading}>
          {isLoading ? "Signing you in..." : "Enter your workspace"}
          {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
