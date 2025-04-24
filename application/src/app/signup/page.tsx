'use client';

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

  const { mutateAsync : createCompany } = api.company.create.useMutation()

  const handleSubmit = async (data: FormValues) => {
    const company = await createCompany(data);

    const cookies = new Cookies(null, { path: '/' });

    cookies.set('token', company.token);
  };


  return (
    <div className="flex flex-col">
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
        Sign up
      </Button>
      <span className="text-sm text-gray-500">
        Already have an account? <Link href="/login" className="text-blue-500">Log in</Link>
      </span>
    </div>
  );
}

