"use client";

import { Stack, Button, Typography, TextField } from "@mui/material";

import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { signup, createCalendar } from '../../../api/api'
import Link from "next/link";

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

export default function Register() {
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [phoneRef, setPhoneRef] = useState("");
  const passRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const handleSubmit = async function (e: React.FormEvent<HTMLFormElement>) {
    try {
      e.preventDefault();

      const name = nameRef.current?.value?.trim() || "";
      const email = emailRef.current?.value?.trim() || "";
      const phone = phoneRef ? `+1${phoneRef}` : "";
      console.log(phone);
      const pass = passRef.current?.value || "";
      const confirm = confirmRef.current?.value || "";

      if (pass !== confirm) throw new Error("Passwords don't match.");
      await signup(name, email, pass, phone);
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
        data-testid="register-page"
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
          <TextField
            size="small"
            required
            label="Full Name"
            inputRef={nameRef}
          />
          <TextField size="small" required label="Email" inputRef={emailRef} />
          <TextField
            size="small"
            required
            label="Phone Number"
            value={phoneRef}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ""); // strip non-digits
              setPhoneRef(val);
            }}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 10,
              }
            }}
          />
          <TextField
            size="small"
            required
            label="Password"
            type="password"
            inputRef={passRef}
          />
          <TextField
            size="small"
            required
            label="Confirm Password"
            type="password"
            inputRef={confirmRef}
          />
        </Stack>
        <Stack spacing={2} sx={{ width: "100%", alignItems: "center", }}>
          <LoginButton type="submit">Sign Up</LoginButton>
          <Link
            href="/signin"
            className="text-black normal-case hover:text-gray"
          >
            Already have an account? Sign In.
          </Link>
        </Stack>
      </Stack>
    </>
  );
}
