"use server";

import { createAuthSession, destroySession } from "../lib/auth";
import { hashUserPassword, verifyPassword } from "../lib/hash";
import { createUser, getuserByEmail } from "../lib/user";
import { redirect } from "next/navigation";

export async function signup(_, formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  let errors = {};

  if (!email.includes("@")) {
    errors.email = "Please enter a valid email address";
  }

  if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // store it in database (create a new user)
  const hashedPassword = hashUserPassword(password);
  try {
    const id = createUser(email, hashedPassword);
    await createAuthSession(id);
    redirect("/training");
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return {
        errors: {
          email: "User with that email already exists",
        },
      };
    }

    throw error;
  }
}

export async function login(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const existingUser = getuserByEmail(email);

  if (!existingUser) {
    return {
      errors: {
        email: "Could not authenticate user, please check your email",
      },
    };
  }

  const isValidPassword = verifyPassword(existingUser.password, password);

  if (!isValidPassword) {
    return {
      errors: {
        password: "Could not authenticate user, please check your password",
      },
    };
  }
  await createAuthSession(existingUser.id);
  redirect("/training");
}

export async function auth(mode, prevState, formData) {
  if(mode === "login") {
    return login(prevState, formData);
  }
  return signup(prevState, formData);
}

export async function logout(){
  await destroySession();
  redirect('/');
}
