'use client';

import { NewInput } from "../_components/common/NewInput";
import { useForm } from "react-hook-form";
import { Button } from "../_components/common/Button";
import Link from "next/link";
import { api } from "@/trpc/react";
import Cookies from 'universal-cookie';
import { useState } from "react";
import { Loader } from "lucide-react";
import { useRouter } from 'next/navigation'

export default function Login() {
  type FormData = {
    email: string;
    password: string;
  };

  const form = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: logIn } = api.company.logIn.useMutation();

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const company = await logIn(data);

      const cookies = new Cookies(null, { path: '/' });

      cookies.set('token', company.token);
      router.push('/');
    } catch (e: unknown) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {error && <span className="text-red-500">{error}</span>}
      <NewInput
        label="Email"
        placeholder="Enter your email"
        type="email"
        {...form.register("email")}
      />
      <NewInput
        label="Password"
        placeholder="Enter your password"
        type="password"
        {...form.register("password")}
      />
      <Button
        onClick={form.handleSubmit(handleSubmit)}
        disabled={loading}
      >
        {!loading ? 'Login' : <Loader />}
      </Button>
      <span className="text-sm text-gray-500">
        {"Don't have an account?"} <Link href="/signup" className="text-blue-500">Sign up</Link>
      </span>
    </div>
  );
}
