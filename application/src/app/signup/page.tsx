'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation'
import { NewInput } from "../_components/common/NewInput";
import { useForm } from "react-hook-form";
import { Button } from "../_components/common/Button";
import { api } from "@/trpc/react";
import Link from "next/link";
import Cookies from 'universal-cookie';

export default function Login() {
  type FormValues = {
    name: string;
    email: string;
    password: string;
  };

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    }
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createCompany } = api.company.create.useMutation()

  const handleSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const company = await createCompany(data);

      const cookies = new Cookies(null, { path: '/' });

      cookies.set('token', company.token);
      router.push('/');
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col">
      {error && <span className="text-red-500">{error}</span>}
      <NewInput
        label="Name"
        placeholder="Enter company name"
        type="text"
        {...form.register("name")}
      />
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
      <Button onClick={form.handleSubmit(handleSubmit)}>
        {!loading ? 'Sign up' : <Loader />}
      </Button>
      <span className="text-sm text-gray-500">
        Already have an account? <Link href="/login" className="text-blue-500">Log in</Link>
      </span>
    </div>
  );
}

