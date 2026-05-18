"use client";

import { Stack, Button, Typography, TextField } from "@mui/material";

import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { signin } from "@/api/api"

const Title = styled(Typography)(({ theme }) => ({
  ...theme.typography.h2,
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  ...theme.typography.h6,
  color: theme.palette.grey[800],
}));

const LoginButton = styled(Button)(({ theme }) => ({
  ...theme.typography.h5,
  backgroundColor: "#000000",
  color: "#FFFFFF",
  "&:hover": {
    backgroundColor: theme.palette.grey[800],
  },
}));

export default function Signin() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const handleSubmit = async function (e: React.FormEvent<HTMLFormElement>) {
    try {
      e.preventDefault();

      const email = emailRef.current?.value?.trim() || "";
      const pass = passRef.current?.value || "";
      await signin(email, pass);
      router.push("/calendars");
    } catch (err: any) {
      console.log(err);

      if (err.message) {
        setErrorMessage(err.message);
      } else if (err?.errors) {
        setErrorMessage(err.errors[0]?.msg);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    }
  };

  return (
    <>
      <Stack
        data-testid="login-page"
        sx={{ height: "100vh", textAlign: "center", justifyContent: "center", alignItems: "center" }}
        spacing={5}
        component="form"
        onSubmit={handleSubmit}
      >
        <Stack spacing={0.5} sx={{ width: "100%", textAlign: "center" }}>
          <Title>Create Account</Title>
          <Typography color="red">{errorMessage}</Typography>
        </Stack>
        <Stack spacing={2} sx={{ width: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", }}>
          <TextField size="small" required label="Email" inputRef={emailRef} />
          <TextField
            size="small"
            required
            label="Password"
            type="password"
            inputRef={passRef}
          />
        </Stack>
        <Stack spacing={2} sx={{ width: "100%", alignItems: "center", }}>
          <LoginButton type="submit">Sign In</LoginButton>
          <Link
            href="/signup"
            className="text-black normal-case hover:text-gray"
          >
            Don't have an account? Sign Up.
          </Link>
        </Stack>
      </Stack>
    </>
  );
}
